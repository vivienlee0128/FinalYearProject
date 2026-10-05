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

      const result =
        await promptAsync();


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

        throw new Error(
          `Microsoft could not authorize sign-in (${
            result.error?.code ??
            'authorization_error'
          }).`
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
        Swinburne Portal
      </Text>


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
            Smart Attendance
            development environment.
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
              This application is
              currently running inside
              Expo Go.
            </Text>


            <Text
              style={
                styles.developmentDescription
              }
            >
              Microsoft authentication
              is bypassed for development
              testing.
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
                Development Student
              </Text>


              <Text
                style={
                  styles.infoValue
                }
              >
                104404156@students.swinburne.edu.my
              </Text>


              <Text
                style={
                  styles.infoLabel
                }
              >
                SIS ID
              </Text>


              <Text
                style={
                  styles.infoValue
                }
              >
                104404156
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
                Continue as Development Student
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
            Sign in with your university
            Microsoft account.
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

      fontSize: 26,

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
        '#222222',

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
        '#fff7e6',

      borderWidth: 1,

      borderColor:
        '#e6c875',

      borderRadius: 12,

      padding: 18,

      gap: 10,

    },


    developmentTitle: {

      fontSize: 14,

      fontWeight:
        '700',

      color:
        '#8a5a00',

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