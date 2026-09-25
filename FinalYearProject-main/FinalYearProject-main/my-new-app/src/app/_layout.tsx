// // import { Stack } from "expo-router";
// // import { AuthProvider } from "../context/Auth";

// // export default function RootLayout() {
// //   return (
// //     <AuthProvider>
// //       <Stack>
// //         <Stack.Screen
// //           name="index"
// //           options={{ headerShown: false }}
// //         />
// //         <Stack.Screen
// //           name="home"
// //           options={{ title: "Home" }}
// //         />
// //         <Stack.Screen
// //           name="attendance"
// //           options={{ title: "Attendance" }}
// //         />
// //       </Stack>
// //     </AuthProvider>
// //   );
// // }

// import { Stack } from "expo-router";
// import { AuthProvider } from "../context/Auth";

// export default function RootLayout() {
//   return (
//     <AuthProvider>
//       <Stack
//         screenOptions={{
//           headerShown: false,
//         }}
//       />
//     </AuthProvider>
//   );
// }

import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/Auth";

function RouteGuard(){
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const onScreenAuth = segments[0] === undefined || segments[0] === "register";

    if (!isAuthenticated && !onScreenAuth){
      router.replace("/");
    }else if(isAuthenticated && onScreenAuth){
      router.replace("/home");
    }
  },[isAuthenticated, segments]);
  return null;
}


export default function RootLayout() {
  console.log("ROOT LAYOUT LOADED");

  return (
    <AuthProvider >
      <RouteGuard />
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="home"
          options={{ title: "Home" }}
        />
        <Stack.Screen
          name="attendance"
          options={{ title: "Attendance Dashboard" }}
        />
      </Stack>
    </AuthProvider>
  );
}