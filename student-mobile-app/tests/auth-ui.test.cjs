const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { create, act } = require('react-test-renderer');
global.IS_REACT_ACT_ENVIRONMENT = true;
function load(relative, mocks) {
  const filename = path.join(__dirname, '..', relative);
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  } });
  const module = { exports: {} };
  vm.runInNewContext(result.outputText, { module, exports: module.exports,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
    setTimeout, clearTimeout, setInterval, clearInterval, console, Date, Error, __DEV__: true,
  }, { filename });
  return module.exports;
}
const native = { View: 'View', Text: 'Text', TouchableOpacity: 'Button', ActivityIndicator: 'Spinner',
  StyleSheet: { create: value => value }, AppState: { addEventListener: () => ({ remove() {} }) } };
const tokens = () => ({ accessToken: 'user-access-token', refreshToken: 'user-refresh-token', expiresIn: 3600, issuedAt: Date.now()/1000 });
const profile = { name: 'Student', email: 'student@example.invalid', role: 'student', student: 'internal-1', sisId: 'sis-1', method: 'microsoft' };
async function provider(t, options = {}) {
  let saved = options.saved ?? null;
  let current;
  const requests = [];
  let refreshCount = 0;
  class ApiError extends Error { constructor(status) { super('API error'); this.status = status; } }
  const mod = load('src/context/Auth.tsx', {
    'react-native': native,
    'expo-auth-session': { refreshAsync: async () => { refreshCount++; if (options.failRefresh) throw new Error(); return tokens(); } },
    '../services/config': { authConfig: { clientId: 'public-id' }, tokenEndpoint: 'https://example.invalid/token', scopes: ['access_as_user'] },
    '../services/session-storage': { readSession: async () => saved, writeSession: async value => { saved = value; } },
    '../services/api': { ApiError, withTimeout: p => p, apiRequest: async (url, token) => {
      requests.push({ url, token });
      if (options.status) throw new ApiError(options.status);
      return { json: async () => options.profile || profile };
    } },
  });
  function Probe() { current = mod.useAuth(); return null; }
  let root;
  await act(async () => { root = create(React.createElement(mod.AuthProvider, null, React.createElement(Probe))); });
  t.after(async () => { await act(async () => root.unmount()); });
  return { current: () => current, saved: () => saved, requests, refreshCount: () => refreshCount };
}
test('sign-in stores tokens only after API validation and logout clears native storage', async t => {
  const state = await provider(t);
  assert.equal(state.current().isAuthenticated, false);
  await act(async () => state.current().signIn(tokens()));
  assert.equal(state.current().isAuthenticated, true);
  assert.equal(state.current().user.student, 'internal-1');
  assert.equal(state.current().user.sisId, 'sis-1');
  assert.equal(state.saved().accessToken, 'user-access-token');
  assert.equal(state.requests[0].url, '/auth/me');
  await act(async () => state.current().signOut());
  assert.equal(state.saved(), null); assert.equal(state.current().isAuthenticated, false);
});
test('API-rejected sign-in cannot authenticate or persist credentials', async t => {
  const state = await provider(t, { status: 403 });
  await act(async () => { await assert.rejects(() => state.current().signIn(tokens())); });
  assert.equal(state.current().isAuthenticated, false); assert.equal(state.saved(), null);
});
test('native restart restores session only after validating it with the API', async t => {
  const state = await provider(t, { saved: { accessToken: 'saved-token', expiresAt: Date.now()+3600000 } });
  assert.equal(state.current().isAuthenticated, true);
  assert.equal(state.requests[0].token, 'saved-token');
});
test('expired native session rotates tokens before loading the profile', async t => {
  const state = await provider(t, { saved: { accessToken: 'expired', refreshToken: 'refresh', expiresAt: 1 } });
  assert.equal(state.refreshCount(), 1); assert.equal(state.current().isAuthenticated, true);
  assert.equal(state.saved().accessToken, 'user-access-token');
});
test('refresh failure clears expired session and returns to sign-in', async t => {
  const state = await provider(t, { failRefresh: true, saved: { accessToken: 'expired', refreshToken: 'refresh', expiresAt: 1 } });
  assert.equal(state.current().isAuthenticated, false); assert.equal(state.saved(), null);
  assert.ok(state.current().error);
});
test('API 401 clears a previously restored session', async t => {
  const state = await provider(t, { status: 401, saved: { accessToken: 'revoked', expiresAt: Date.now()+3600000 } });
  assert.equal(state.current().isAuthenticated, false); assert.equal(state.saved(), null);
});
async function login(t, options = {}) {
  const events = []; let authConfig; let root; let promptCount = 0;
  class AuthRequest {
    constructor(config) { authConfig = config; this.codeVerifier = 'test-verifier'; }
    async makeAuthUrlAsync() { if (options.failPreparation) throw new Error('Preparation failed'); }
    async promptAsync() { promptCount++; events.push('prompt'); if (options.failPrompt) throw new Error('Browser blocked'); return options.result || { type: 'success', params: { code: 'test-code' } }; }
  }
  const mod = load('src/app/index.tsx', {
    'react-native': native,
    'expo-router': { useRouter: () => ({ replace: value => events.push(`replace:${value}`), dismissTo: value => events.push(`dismiss:${value}`) }) },
    '../context/Auth': { useAuth: () => ({ signIn: async value => { events.push('validated-sign-in'); assert.equal(value.accessToken, 'user-access-token'); }, error: null }) },
    '../services/config': { authConfig: { clientId: 'public-client' }, configurationError: () => options.configError || null,
      getRedirectUri: () => 'mynewapp://auth/callback', issuer: 'https://example.invalid', scopes: ['openid','access_as_user'] },
    '../services/api': { withTimeout: value => value },
    'expo-auth-session': { AuthRequest, Prompt: { SelectAccount: 'select_account' }, ResponseType: { Code: 'code' },
      fetchDiscoveryAsync: async () => ({}), exchangeCodeAsync: async config => {
        events.push('exchange'); assert.equal(config.extraParams.code_verifier, 'test-verifier');
        assert.equal(config.redirectUri, 'mynewapp://auth/callback'); return tokens();
      } },
  });
  await act(async () => { root = create(React.createElement(mod.default)); });
  t.after(async () => { await act(async () => root.unmount()); });
  return { root, events, config: () => authConfig, promptCount: () => promptCount };
}
test('prepared PKCE request opens browser, exchanges once, validates user then navigates home', async t => {
  const state = await login(t);
  assert.equal(state.config().usePKCE, true); assert.equal(state.config().responseType, 'code');
  const button = state.root.root.findAllByType('Button')[0];
  assert.equal(button.props.disabled, false);
  await act(async () => { button.props.onPress(); button.props.onPress(); });
  assert.equal(state.promptCount(), 1);
  assert.deepEqual(state.events, ['prompt','exchange','validated-sign-in','replace:/home']);
});
test('cancelled sign-in shows retry without code exchange', async t => {
  const state = await login(t, { result: { type: 'cancel' } });
  await act(async () => state.root.root.findAllByType('Button')[0].props.onPress());
  assert.deepEqual(state.events, ['prompt','dismiss:/']);
  assert.match(JSON.stringify(state.root.toJSON()), /cancelled/);
  assert.equal(state.root.root.findAllByType('Button').length, 2);
});
test('preparation and browser errors are visible and retryable', async t => {
  const preparation = await login(t, { failPreparation: true });
  assert.match(JSON.stringify(preparation.root.toJSON()), /Preparation failed/);
  assert.equal(preparation.root.root.findAllByType('Button')[0].props.disabled, true);
  const browser = await login(t, { failPrompt: true });
  await act(async () => browser.root.root.findAllByType('Button')[0].props.onPress());
  assert.match(JSON.stringify(browser.root.toJSON()), /Browser blocked/);
});
test('Expo Go/configuration failure never starts an auth request', async t => {
  const state = await login(t, { configError: 'Use an Android development build.' });
  assert.equal(state.config(), undefined);
  assert.match(JSON.stringify(state.root.toJSON()), /Android development build/);
});

test('route protection keeps callback public and separates student and lecturer screens', async () => {
  for (const role of [null, 'student', 'lecturer']) {
    const Stack = ({ children }) => React.createElement('Stack', null, children);
    Stack.Screen = props => React.createElement('Screen', props);
    Stack.Protected = ({ guard, children }) => guard ? children : null;
    const mod = load('src/app/_layout.tsx', {
      'react-native': native, 'expo-router': { Stack },
      '../context/Auth': { AuthProvider: ({ children }) => children,
        useAuth: () => ({ isAuthenticated: !!role, isLoading: false, user: role ? { role } : null }) },
    });
    let root;
    await act(async () => { root = create(React.createElement(mod.default)); });
    const names = root.root.findAllByType('Screen').map(x => x.props.name);
    assert.ok(names.includes('auth/callback'));
    assert.equal(names.includes('index'), !role);
    assert.equal(names.includes('home'), !!role);
    assert.equal(names.includes('qr'), role === 'student');
    assert.equal(names.includes('lecture'), role === 'lecturer');
    assert.equal(names[0], role ? 'home' : 'index');
    await act(async () => root.unmount());
  }
});
