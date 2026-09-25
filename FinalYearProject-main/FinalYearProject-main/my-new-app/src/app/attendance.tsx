// import * as Print from 'expo-print';
// import * as Sharing from 'expo-sharing';
// import React from 'react';
// import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
// import {useAuth} from '../app/auth/callback'

// export default function AttendanceReport() {
//   // This HTML string is used strictly to format the downloaded PDF exactly like a formal A4 letter.
//   const htmlContent = `
//     <html>
//       <head>
//         <style>
//           body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #000; }
//           .header-container { display: flex; justify-content: space-between; margin-bottom: 40px; }
//           .ref-date { font-size: 14px; line-height: 1.5; }
//           .logo { text-align: right; font-weight: bold; font-size: 16px; color: #cc0000; line-height: 1.2; }
//           .logo-large { font-size: 24px; letter-spacing: 2px; }
//           .salutation { margin-top: 20px; font-size: 14px; font-weight: bold; }
//           .body-text { font-size: 14px; margin-top: 15px; line-height: 1.5; }
//           .title { font-weight: bold; text-decoration: underline; margin: 20px 0; font-size: 14px; }
//           table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
//           th, td { border: 1px solid black; padding: 8px; text-align: left; }
//           th { background-color: #f2f2f2; }
//           .key-table { width: 40%; margin-top: 20px; }
//           .footer { margin-top: 40px; font-size: 14px; line-height: 1.5; }
//         </style>
//       </head>
//       <body>
//         <div class="header-container">
//           <div class="ref-date">
//             <p>Ref: INT/AR/001</p>
//             <p>Date: 07 Jan 2026</p>
//           </div>
//           <div class="logo">
//             <span class="logo-large">SWIN<br>BUR<br>NE<br>4</span><br>
//             SWINBURNE<br>UNIVERSITY OF<br>TECHNOLOGY
//           </div>
//         </div>

//         <div class="salutation">TO WHOM IT MAY CONCERN</div>
//         <div class="body-text">Dear Sir/Madam,</div>
        
//         <div class="title">ATTENDANCE REPORT FOR ___________________</div>
        
//         <div class="body-text">
//           With reference to the subject above, we would like to advise the attendance report for her academic for:<br><br>
//           <strong>Program:</strong> Bachelor of Science (Biotechnology)<br>
//           <strong>Period:</strong> 2024_FEB_51 to 2025_SEP_S2
//         </div>

//         <table>
//           <tr>
//             <th>Intake</th>
//             <th>Overall Attendance</th>
//             <th>Percentages (%)</th>
//           </tr>
//           <tr>
//             <td>2024_FEB_S1</td>
//             <td>Good</td>
//             <td>83.65%</td>
//           </tr>
//           <tr>
//             <td>2024_SEP_S2</td>
//             <td>Fair</td>
//             <td>41.51%</td>
//           </tr>
//           <tr>
//             <td>2025_MAR S1</td>
//             <td>Fair</td>
//             <td>61.82%</td>
//           </tr>
//           <tr>
//             <td>2025_SEP_S2</td>
//             <td>Fair</td>
//             <td>44.78%</td>
//           </tr>
//         </table>

//         <table class="key-table">
//           <tr>
//             <th>Key</th>
//             <th>Percentages (%)</th>
//           </tr>
//           <tr>
//             <td>Good</td>
//             <td>80-100</td>
//           </tr>
//           <tr>
//             <td>Fair</td>
//             <td>40-79</td>
//           </tr>
//           <tr>
//             <td>Poor</td>
//             <td>1-39</td>
//           </tr>
//           <tr>
//             <td>Nil</td>
//             <td>0</td>
//           </tr>
//         </table>

//         <div class="footer">
//           <p>If there are any further queries, please contact: ___________________ or email 50841 or email 41 or email ___________________</p>
//           <br>
//           <p>Yours sincerely,</p>
//           <br><br><br>
//           <p>
//             Swinburne University of Technology Sarawak Campus<br>
//             Swinbume Sarawak Sdn. Bhd.
//           </p>
//         </div>
//       </body>
//     </html>
//   `;

//   const generateAndSharePDF = async () => {
//     try {
//       // 1. Generate the PDF from the HTML string
//       const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
//       // 2. Open the native sharing modal to save/download the PDF
//       if (await Sharing.isAvailableAsync()) {
//         await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
//       } else {
//         Alert.alert('Error', 'Sharing is not available on this device');
//       }
//     } catch (error) {
//       console.error(error);
//       Alert.alert('Error', 'Failed to generate PDF');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {/* Visual Preview on the Phone */}
//       <ScrollView style={styles.previewContainer} contentContainerStyle={{ paddingBottom: 40 }}>
//         <View style={styles.headerRow}>
//           <View>
//             <Text style={styles.text}>Ref: INT/AR/001</Text>
//             <Text style={styles.text}>Date: 07 Jan 2026</Text>
//           </View>
//           <Text style={styles.logoText}>SWINBURNE</Text>
//         </View>

//         <Text style={styles.boldText}>TO WHOM IT MAY CONCERN</Text>
//         <Text style={styles.text}>Dear Sir/Madam,</Text>
        
//         <Text style={[styles.boldText, styles.title]}>ATTENDANCE REPORT FOR</Text>
        
//         <Text style={styles.text}>
//           With reference to the subject above, we would like to advise the attendance report for her academic for:
//         </Text>
        
//         <Text style={styles.text}><Text style={styles.boldText}>Program:</Text> Bachelor of Science (Biotechnology)</Text>
//         <Text style={styles.text}><Text style={styles.boldText}>Period</Text> 2024_FEB_51 to 2025_SEP_S2</Text>

//         <View style={styles.table}>
//           <View style={[styles.tableRow, styles.tableHeader]}>
//             <Text style={styles.tableCell}>Intake</Text>
//             <Text style={styles.tableCell}>Overall Attendance</Text>
//             <Text style={styles.tableCell}>Percentages (%)</Text>
//           </View>
//           <View style={styles.tableRow}><Text style={styles.tableCell}>2024_FEB_S1</Text><Text style={styles.tableCell}>Good</Text><Text style={styles.tableCell}>83.65%</Text></View>
//           <View style={styles.tableRow}><Text style={styles.tableCell}>2024_SEP_S2</Text><Text style={styles.tableCell}>Fair</Text><Text style={styles.tableCell}>41.51%</Text></View>
//           <View style={styles.tableRow}><Text style={styles.tableCell}>2025_MAR S1</Text><Text style={styles.tableCell}>Fair</Text><Text style={styles.tableCell}>61.82%</Text></View>
//           <View style={styles.tableRow}><Text style={styles.tableCell}>2025_SEP_S2</Text><Text style={styles.tableCell}>Fair</Text><Text style={styles.tableCell}>44.78%</Text></View>
//         </View>

//         <View style={[styles.table, { width: '60%' }]}>
//           <View style={[styles.tableRow, styles.tableHeader]}>
//             <Text style={styles.tableCell}>Key</Text>
//             <Text style={styles.tableCell}>Percentages (%)</Text>
//           </View>
//           <View style={styles.tableRow}><Text style={styles.tableCell}>Good</Text><Text style={styles.tableCell}>80-100</Text></View>
//           <View style={styles.tableRow}><Text style={styles.tableCell}>Fair</Text><Text style={styles.tableCell}>40-79</Text></View>
//           <View style={styles.tableRow}><Text style={styles.tableCell}>Poor</Text><Text style={styles.tableCell}>1-39</Text></View>
//           <View style={styles.tableRow}><Text style={styles.tableCell}>Nil</Text><Text style={styles.tableCell}>0</Text></View>
//         </View>
        
//         <Text style={[styles.text, { marginTop: 20 }]}>If there are any further queries, please contact:</Text>
//         <Text style={styles.text}>Yours sincerely</Text>
//         <Text style={[styles.text, { marginTop: 40 }]}>Swinburne University of Technology Sarawak Campus</Text>
//         <Text style={styles.text}>Swinbume Sarawak Sdn. Bhd.</Text>
//       </ScrollView>

//       {/* Floating Print Button */}
//       <TouchableOpacity style={styles.printButton} onPress={generateAndSharePDF}>
//         <Text style={styles.printButtonText}>Download as PDF</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f9f9f9' },
//   previewContainer: { flex: 1, padding: 20, backgroundColor: '#ffffff', margin: 10, borderRadius: 8, elevation: 2 },
//   headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
//   logoText: { color: '#cc0000', fontWeight: 'bold', fontSize: 16, textAlign: 'right' },
//   text: { fontSize: 12, marginBottom: 5, color: '#333' },
//   boldText: { fontSize: 12, fontWeight: 'bold', marginTop: 10, color: '#000' },
//   title: { textDecorationLine: 'underline', marginBottom: 10, marginTop: 20 },
//   table: { borderWidth: 1, borderColor: '#000', marginTop: 15, marginBottom: 15 },
//   tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
//   tableHeader: { backgroundColor: '#f2f2f2' },
//   tableCell: { flex: 1, padding: 5, borderRightWidth: 1, borderColor: '#000', fontSize: 11 },
//   printButton: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#000', padding: 15, borderRadius: 10, alignItems: 'center' },
//   printButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
// });

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/Auth';

// IMPORTANT: Replace '192.168.1.100' with your computer's actual local IPv4 address
const QWICKLY_AUTH_URL = 'http://192.168.1.100:54763/api/auth/token';
const QWICKLY_API_BASE = 'http://192.168.1.100:54763/api/dashboard/v1';

interface AttendanceRecord {
  intake: string;
  overall_attendance: string;
  percentage: string;
}

export default function AttendanceReport() {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch data from Qwickly Emulator
  useEffect(() => {
    async function fetchQwicklyData() {
      try {
        // STEP 1: Get the OAuth Token
        const tokenResponse = await fetch(QWICKLY_AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET',
        });

        if (!tokenResponse.ok) throw new Error('Failed to authenticate with Qwickly');
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // STEP 2: Fetch Data using the Token
        const dataResponse = await fetch(`${QWICKLY_API_BASE}/courses`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!dataResponse.ok) throw new Error('Failed to fetch data from Qwickly');
        const qwicklyCourses = await dataResponse.json();

        // STEP 3: Map Qwickly Data to your PDF Table Format
        const formattedRecords: AttendanceRecord[] = qwicklyCourses.map((course: any) => ({
          intake: course.semester, 
          overall_attendance: 'Good', // Placeholder for actual API attendance text
          percentage: '85.00',        // Placeholder for actual API percentage
        }));

        setAttendanceData(formattedRecords);

      } catch (error) {
        console.error("Qwickly Fetch Error:", error);
        Alert.alert('Error', 'Could not load official attendance records.');
        
        // Fallback mock data if server is unreachable so the UI doesn't break
        setAttendanceData([
          { intake: '2024_FEB_S1', overall_attendance: 'Good', percentage: '83.65' },
          { intake: '2024_SEP_S2', overall_attendance: 'Fair', percentage: '41.51' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQwicklyData();
  }, [user]);

  // 2. Map the fetched data into HTML table rows
  const dynamicTableRows = attendanceData.map(record => `
    <tr>
      <td>${record.intake}</td>
      <td>${record.overall_attendance}</td>
      <td>${record.percentage}%</td>
    </tr>
  `).join('');

  // 3. Formatted current date
  const currentDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // 4. Inject dynamic variables into the HTML string
  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #000; }
          .header-container { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .ref-date { font-size: 14px; line-height: 1.5; }
          .logo { text-align: right; font-weight: bold; font-size: 16px; color: #cc0000; line-height: 1.2; }
          .logo-large { font-size: 24px; letter-spacing: 2px; }
          .salutation { margin-top: 20px; font-size: 14px; font-weight: bold; }
          .body-text { font-size: 14px; margin-top: 15px; line-height: 1.5; }
          .title { font-weight: bold; text-decoration: underline; margin: 20px 0; font-size: 14px; text-transform: uppercase;}
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px; }
          th, td { border: 1px solid black; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .key-table { width: 40%; margin-top: 20px; }
          .footer { margin-top: 40px; font-size: 14px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <div class="ref-date">
            <p>Ref: INT/AR/001</p>
            <p>Date: ${currentDate}</p>
          </div>
          <div class="logo">
            <span class="logo-large">SWIN<br>BUR<br>NE<br>4</span><br>
            SWINBURNE<br>UNIVERSITY OF<br>TECHNOLOGY
          </div>
        </div>

        <div class="salutation">TO WHOM IT MAY CONCERN</div>
        <div class="body-text">Dear Sir/Madam,</div>
        
        <div class="title">ATTENDANCE REPORT FOR ${user?.name?.toUpperCase() || 'STUDENT'}</div>
        
        <div class="body-text">
          With reference to the subject above, we would like to advise the attendance report for academic for:<br><br>
          <strong>Program:</strong> Bachelor of Science (Biotechnology)<br>
          <strong>Student ID:</strong> ${user?.student || 'N/A'}
        </div>

        <table>
          <tr>
            <th>Intake</th>
            <th>Overall Attendance</th>
            <th>Percentages (%)</th>
          </tr>
          ${dynamicTableRows}
        </table>

        <table class="key-table">
          <tr>
            <th>Key</th>
            <th>Percentages (%)</th>
          </tr>
          <tr><td>Good</td><td>80-100</td></tr>
          <tr><td>Fair</td><td>40-79</td></tr>
          <tr><td>Poor</td><td>1-39</td></tr>
          <tr><td>Nil</td><td>0</td></tr>
        </table>

        <div class="footer">
          <p>If there are any further queries, please contact: ___________________ or email 50841 or email 41</p>
          <br><p>Yours sincerely,</p><br><br><br>
          <p>Swinburne University of Technology Sarawak Campus<br>Swinbume Sarawak Sdn. Bhd.</p>
        </div>
      </body>
    </html>
  `;

  const generateAndSharePDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#cc0000" />
        <Text style={{ marginTop: 10 }}>Fetching Official Records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.previewContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* React Native Visual Preview */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.text}>Ref: INT/AR/001</Text>
            <Text style={styles.text}>Date: {currentDate}</Text>
          </View>
          <Text style={styles.logoText}>SWINBURNE</Text>
        </View>

        <Text style={styles.boldText}>TO WHOM IT MAY CONCERN</Text>
        <Text style={styles.text}>Dear Sir/Madam,</Text>

        <Text style={[styles.boldText, styles.title]}>ATTENDANCE REPORT FOR {user?.name?.toUpperCase() || 'STUDENT'}</Text>
        
        <Text style={styles.text}>
          With reference to the subject above, we would like to advise the attendance report for academic for:
        </Text>
        
        <Text style={styles.text}><Text style={styles.boldText}>Program:</Text> Bachelor of Science (Biotechnology)</Text>
        <Text style={styles.text}><Text style={styles.boldText}>Student ID:</Text> {user?.student || 'N/A'}</Text>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Intake</Text>
            <Text style={styles.tableCell}>Overall Attendance</Text>
            <Text style={styles.tableCell}>Percentages (%)</Text>
          </View>
          
          {attendanceData.map((record, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{record.intake}</Text>
              <Text style={styles.tableCell}>{record.overall_attendance}</Text>
              <Text style={styles.tableCell}>{record.percentage}%</Text>
            </View>
          ))}
        </View>

        <View style={[styles.table, { width: '60%' }]}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Key</Text>
            <Text style={styles.tableCell}>Percentages (%)</Text>
          </View>
          <View style={styles.tableRow}><Text style={styles.tableCell}>Good</Text><Text style={styles.tableCell}>80-100</Text></View>
          <View style={styles.tableRow}><Text style={styles.tableCell}>Fair</Text><Text style={styles.tableCell}>40-79</Text></View>
          <View style={styles.tableRow}><Text style={styles.tableCell}>Poor</Text><Text style={styles.tableCell}>1-39</Text></View>
          <View style={styles.tableRow}><Text style={styles.tableCell}>Nil</Text><Text style={styles.tableCell}>0</Text></View>
        </View>
        
        <Text style={[styles.text, { marginTop: 20 }]}>If there are any further queries, please contact:</Text>
        <Text style={styles.text}>Yours sincerely</Text>
        <Text style={[styles.text, { marginTop: 40 }]}>Swinburne University of Technology Sarawak Campus</Text>
        <Text style={styles.text}>Swinbume Sarawak Sdn. Bhd.</Text>
      </ScrollView>

      <TouchableOpacity style={styles.printButton} onPress={generateAndSharePDF}>
        <Text style={styles.printButtonText}>Download as PDF</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  previewContainer: { flex: 1, padding: 20, backgroundColor: '#ffffff', margin: 10, borderRadius: 8, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  logoText: { color: '#cc0000', fontWeight: 'bold', fontSize: 16, textAlign: 'right' },
  text: { fontSize: 12, marginBottom: 5, color: '#333' },
  boldText: { fontSize: 12, fontWeight: 'bold', marginTop: 10, color: '#000' },
  title: { textDecorationLine: 'underline', marginBottom: 10, marginTop: 20, fontSize: 12 },
  table: { borderWidth: 1, borderColor: '#000', marginTop: 15, marginBottom: 15 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000' },
  tableHeader: { backgroundColor: '#f2f2f2' },
  tableCell: { flex: 1, padding: 5, borderRightWidth: 1, borderColor: '#000', fontSize: 11 },
  printButton: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#000', padding: 15, borderRadius: 10, alignItems: 'center' },
  printButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});