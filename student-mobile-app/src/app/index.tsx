import {
  exchangeCodeAsync,
  Prompt,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';

import Constants, {
  ExecutionEnvironment,
} from 'expo-constants';

import { useRouter } from 'expo-router';

import * as WebBrowser from 'expo-web-browser';

import {
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  useAuth,
} from '../context/Auth';

import {
  authConfig,
  configurationError,
  getRedirectUri,
  issuer,
  scopes,
} from '../services/config';


WebBrowser.maybeCompleteAuthSession();


export default function Login() {

  const router =
    useRouter();


  const {
    signIn,
    developmentSignIn,
    error: sessionError,
  } = useAuth();


  const [busy, setBusy] =
    useState(false);

  const [
    loginError,
    setLoginError,
  ] = useState<string | null>(
    null
  );


  const inFlight =
    useRef(false);


  // ==========================================
  // DETECT EXPO GO
  // ==========================================

  const isExpoGo =
    Platform.OS !== 'web' &&
    Constants.executionEnvironment ===
      ExecutionEnvironment.StoreClient;


  // ==========================================
  // MICROSOFT CONFIGURATION
  // ==========================================

  const configError =
    configurationError();

  const discovery =
    useAutoDiscovery(
      issuer
    );

  const redirectUri =
    getRedirectUri();


  const [
    request,
    ,
    promptAsync,
  ] = useAuthRequest(
    {
      clientId:
        authConfig.clientId,

      scopes,

      redirectUri,

      responseType:
        ResponseType.Code,

      usePKCE:
        true,

      prompt:
        Prompt.SelectAccount,
    },
    discovery
  );


  const preparing =
    !isExpoGo &&
    !configError &&
    (
      !discovery ||
      !request
    );


  // ==========================================
  // MICROSOFT LOGIN
  // ==========================================

  async function login() {

    if (
      isExpoGo ||
      configError ||
      !discovery ||
      !request ||
      busy ||
      inFlight.current
    ) {
      return;
    }


    inFlight.current = true;

    setBusy(true);

    setLoginError(null);


    try {

      // Log ONLY public request configuration, never full authorization URLs,
      // authorization codes, PKCE verifiers, cookies or access tokens.
      console.log('[LOGIN] Client ID:', authConfig.clientId);
      console.log('[LOGIN] Tenant issuer:', issuer);
      console.log('[LOGIN] Redirect URI:', redirectUri);
      console.log('[LOGIN] Requested scopes:', scopes.join(' '));
      console.log('[LOGIN] Discovery ready:', !!discovery);

      const result = await promptAsync();
      console.log('[LOGIN] Auth result type:', result.type);

      if (result.type === 'error') {
        console.log('[LOGIN] Auth error code:', result.error?.code);
        // Microsoft supplies a useful AADSTS code in error_description.
        // This is diagnostic text, not a token.
        const reason = String(
          result.params?.error_description ??
          result.error?.message ??
          'No description returned'
        );
        console.log('[LOGIN] Microsoft error description:', reason.slice(0, 750));
      }


      if (
        result.type === 'cancel' ||
        result.type === 'dismiss'
      ) {

        throw new Error(
          'Sign-in was cancelled. You can try again.'
        );

      }


      if (
        result.type === 'error'
      ) {

        const detail = String(
          result.params?.error_description ??
          result.error?.message ??
          ''
        ).replace(/\s+/g, ' ').trim();

        throw new Error(
          `Microsoft sign-in failed (${result.error?.code ?? 'authorization_error'}).` +
          (detail ? ` ${detail.slice(0, 350)}` : '')
        );

      }


      if (
        result.type !== 'success' ||
        !result.params.code ||
        !request.codeVerifier
      ) {

        throw new Error(
          'Microsoft did not return a valid authorization code.'
        );

      }


      const tokens =
        await exchangeCodeAsync(
          {
            clientId:
              authConfig.clientId,

            code:
              result.params.code,

            redirectUri,

            extraParams: {
              code_verifier:
                request.codeVerifier,
            },
          },
          discovery
        );


      await signIn(
        tokens
      );


      router.replace(
        '/home'
      );

    } catch (err) {

      setLoginError(
        err instanceof Error
          ? err.message
          : 'Microsoft sign-in failed.'
      );

    } finally {

      inFlight.current =
        false;

      setBusy(
        false
      );

    }

  }


  // ==========================================
  // EXPO GO DEVELOPMENT LOGIN
  // ==========================================

  async function loginDevelopment() {

    if (
      busy ||
      inFlight.current
    ) {
      return;
    }


    inFlight.current =
      true;

    setBusy(
      true
    );

    setLoginError(
      null
    );


    try {

      console.log(
        '=============================='
      );

      console.log(
        '[LOGIN] Expo Go development login'
      );


      await developmentSignIn();


      console.log(
        '[LOGIN] Opening student home'
      );

      console.log(
        '=============================='
      );


      router.replace(
        '/home'
      );

    } catch (err) {

      console.error(
        '[LOGIN] Development login failed:',
        err
      );


      setLoginError(
        err instanceof Error
          ? err.message
          : 'Development login failed.'
      );

    } finally {

      inFlight.current =
        false;

      setBusy(
        false
      );

    }

  }


  // ==========================================
  // UI
  // ==========================================

  return (

    <View
      style={
        styles.container
      }
    >

      <Text
        style={
          styles.title
        }
      >
        Student Attendance
      </Text>


      <Image
        source={require('../../assets/branding/swinburne-logo.png')}
        style={{width:138,height:70,marginBottom:2}}
        resizeMode="contain"
        accessibilityLabel="Swinburne university logo"
      />
      <Text style={{color:'#ED1C2E',fontWeight:'800',fontSize:11,letterSpacing:1.4}}>SARAWAK · FYP PROTOTYPE</Text>
      {/* =====================================
          EXPO GO
          ===================================== */}

      {isExpoGo ? (

        <>

          <Text
            style={
              styles.subtitle
            }
          >
            Student demo preview. All displayed attendance data is fictional unless the demo n8n endpoint is configured.
          </Text>


          <View
            style={
              styles.developmentCard
            }
          >

            <Text
              style={
                styles.developmentTitle
              }
            >
              DEVELOPMENT MODE
            </Text>


            <Text
              style={
                styles.developmentDescription
              }
            >
              This is a student-only Expo Go preview. It does not provide university authentication.
            </Text>


            <Text
              style={
                styles.developmentDescription
              }
            >
              Microsoft authentication is bypassed only for fictional demonstration screens.
            </Text>


            <View
              style={
                styles.studentInfo
              }
            >

              <Text
                style={
                  styles.infoLabel
                }
              >
                Demonstration account
              </Text>


              <Text
                style={
                  styles.infoValue
                }
              >
                900000001@students.example.invalid
              </Text>


              <Text
                style={
                  styles.infoLabel
                }
              >
                Permissions
              </Text>


              <Text
                style={
                  styles.infoValue
                }
              >
                Preview only
              </Text>

            </View>

          </View>


          {loginError && (

            <Text
              accessibilityRole="alert"
              style={
                styles.error
              }
            >
              DEVELOPMENT:
              {' '}
              {loginError}
            </Text>

          )}


          {sessionError && (

            <Text
              accessibilityRole="alert"
              style={
                styles.error
              }
            >
              SESSION:
              {' '}
              {sessionError}
            </Text>

          )}


          <TouchableOpacity
            accessibilityRole="button"
            disabled={
              busy
            }
            onPress={() =>
              void loginDevelopment()
            }
            style={[
              styles.button,
              busy &&
                styles.disabled,
            ]}
          >

            {busy ? (

              <ActivityIndicator
                color="#ffffff"
              />

            ) : (

              <Text
                style={
                  styles.buttonText
                }
              >
                Open student demo
              </Text>

            )}

          </TouchableOpacity>


          <Text
            style={
              styles.developmentHint
            }
          >
            Microsoft SSO is still used
            in the production/development
            build. This option exists only
            for testing through Expo Go.
          </Text>


          {__DEV__ && (

            <Text
              selectable
              style={
                styles.hint
              }
            >
              Expo Go Redirect URI:
              {' '}
              {redirectUri}
            </Text>

          )}

        </>

      ) : (

        /* =====================================
           MICROSOFT SSO
           ===================================== */

        <>

          <Text
            style={
              styles.subtitle
            }
          >
            Sign in with your Swinburne student Microsoft account to scan attendance QR codes and view your own attendance.
          </Text>


          {preparing && (

            <ActivityIndicator
              accessibilityLabel=
                "Preparing Microsoft sign-in"
            />

          )}


          {configError && (

            <Text
              accessibilityRole="alert"
              style={
                styles.error
              }
            >
              CONFIG:
              {' '}
              {configError}
            </Text>

          )}


          {loginError && (

            <Text
              accessibilityRole="alert"
              style={
                styles.error
              }
            >
              MICROSOFT:
              {' '}
              {loginError}
            </Text>

          )}


          {sessionError && (

            <Text
              accessibilityRole="alert"
              style={
                styles.error
              }
            >
              SESSION:
              {' '}
              {sessionError}
            </Text>

          )}


          <TouchableOpacity
            accessibilityRole="button"
            disabled={
              !!configError ||
              preparing ||
              busy
            }
            onPress={() =>
              void login()
            }
            style={[
              styles.button,

              (
                !!configError ||
                preparing ||
                busy
              ) &&
                styles.disabled,
            ]}
          >

            <Text
              style={
                styles.buttonText
              }
            >
              {
                preparing
                  ? 'Preparing sign-in...'
                  : busy
                    ? 'Signing in...'
                    : 'Sign in with Microsoft'
              }
            </Text>

          </TouchableOpacity>


          {__DEV__ && (

            <Text
              selectable
              style={
                styles.hint
              }
            >
              Redirect URI:
              {' '}
              {redirectUri}
            </Text>

          )}

        </>

      )}

      <Text style={{fontSize:11,lineHeight:17,color:'#868D98',textAlign:'center'}}>
        Research prototype · Not an official Swinburne service or attendance authority.
      </Text>
    </View>

  );

}


// ============================================
// STYLES
// ============================================

const styles =
  StyleSheet.create({

    container: {

      flex: 1,

      justifyContent:
        'center',

      padding: 24,

      gap: 16,

      backgroundColor:
        '#ffffff',

    },


    title: {

      fontSize: 30,
      color: '#101114',
      letterSpacing: -1,

      fontWeight:
        'bold',

    },


    subtitle: {

      fontSize: 15,

      color:
        '#444444',

      lineHeight: 22,

    },


    error: {

      color:
        '#a00000',

    },


    hint: {

      color:
        '#666666',

      fontSize: 12,

      marginTop: 4,

    },


    button: {

      padding: 16,

      borderRadius: 10,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#ED1C2E',

      minHeight: 54,

    },


    disabled: {

      opacity: 0.45,

    },


    buttonText: {

      color:
        '#ffffff',

      fontWeight:
        '600',

    },


    developmentCard: {

      backgroundColor:
        '#FFF5F5',

      borderWidth: 1,

      borderColor:
        '#F7C8CC',

      borderRadius: 12,

      padding: 18,

      gap: 10,

    },


    developmentTitle: {

      fontSize: 14,

      fontWeight:
        '700',

      color:
        '#9E1930',

    },


    developmentDescription: {

      fontSize: 13,

      lineHeight: 19,

      color:
        '#555555',

    },


    studentInfo: {

      marginTop: 8,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor:
        '#e2d4aa',

      gap: 4,

    },


    infoLabel: {

      fontSize: 11,

      color:
        '#777777',

      marginTop: 5,

    },


    infoValue: {

      fontSize: 14,

      fontWeight:
        '600',

      color:
        '#222222',

    },


    developmentHint: {

      fontSize: 12,

      lineHeight: 18,

      textAlign:
        'center',

      color:
        '#777777',

    },

  });