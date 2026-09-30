import { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../context/Auth';

import {
  AttendanceReportResponse,
  getAttendanceReport,
} from '../services/reportAPI';

import {
  generateAttendancePdf,
  shareAttendancePdf,
} from '../services/pdfService';


export default function AttendanceReportScreen() {

  const { user } = useAuth();

  const [loading, setLoading] =
    useState(false);

  const [report, setReport] =
    useState<AttendanceReportResponse | null>(
      null
    );

  const [pdfUri, setPdfUri] =
    useState<string | null>(null);


  async function generateReport() {

    if (!user?.sisId) {

      Alert.alert(
        'Unable to Generate Report',
        'Student ID could not be determined.'
      );

      return;
    }


    try {

      setLoading(true);

      setPdfUri(null);


      console.log(
        '[Report] Student:',
        user.email
      );

      console.log(
        '[Report] SIS ID:',
        user.sisId
      );


      // Get report data from n8n

      const reportData =
        await getAttendanceReport(
          user.sisId
        );


      setReport(reportData);


      // Convert report data → HTML → PDF

      const uri =
        await generateAttendancePdf(
          reportData
        );


      setPdfUri(uri);


      Alert.alert(
        'Report Generated',
        'Your attendance report has been generated successfully.'
      );


    } catch (error) {

      console.error(
        '[Report] Error:',
        error
      );


      Alert.alert(
        'Report Error',

        error instanceof Error
          ? error.message
          : 'Unable to generate attendance report.'
      );


    } finally {

      setLoading(false);

    }

  }


  async function shareReport() {

    if (!pdfUri) {
      return;
    }


    try {

      await shareAttendancePdf(
        pdfUri
      );


    } catch (error) {

      console.error(
        '[PDF] Share error:',
        error
      );


      Alert.alert(
        'Share Error',

        error instanceof Error
          ? error.message
          : 'Unable to share the PDF.'
      );

    }

  }


  return (

    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >

      <Text style={styles.title}>
        Attendance Report
      </Text>


      <Text style={styles.description}>
        Generate your attendance report
        as a PDF document.
      </Text>


      {/* STUDENT */}

      <View style={styles.card}>

        <Text style={styles.label}>
          Student
        </Text>

        <Text style={styles.value}>
          {user?.name ?? 'Unknown'}
        </Text>


        <Text style={styles.label}>
          Student ID
        </Text>

        <Text style={styles.value}>
          {user?.sisId ?? 'Unavailable'}
        </Text>

      </View>


      {/* GENERATE */}

      <TouchableOpacity
        style={[
          styles.generateButton,

          loading &&
            styles.disabledButton
        ]}
        disabled={loading}
        onPress={() =>
          void generateReport()
        }
      >

        {loading ? (

          <ActivityIndicator
            color="#ffffff"
          />

        ) : (

          <Text
            style={
              styles.generateButtonText
            }
          >
            Generate PDF Report
          </Text>

        )}

      </TouchableOpacity>


      {/* REPORT RESULT */}

      {report && (

        <View style={styles.card}>

          <Text style={styles.cardTitle}>
            Report Information
          </Text>


          <Text style={styles.info}>
            Reference:
            {' '}
            {report.report.reference}
          </Text>


          <Text style={styles.info}>
            Date:
            {' '}
            {report.report.date}
          </Text>


          <Text style={styles.info}>
            Period:
            {' '}
            {report.report.period}
          </Text>


          {report.attendance.map(
            (item, index) => (

              <View
                key={index}
                style={styles.attendance}
              >

                <Text style={styles.intake}>
                  {item.intake}
                </Text>

                <Text>
                  Attendance:
                  {' '}
                  {item.status}
                </Text>

                <Text>
                  Percentage:
                  {' '}
                  {item.percentage}%
                </Text>

              </View>

            )
          )}

        </View>

      )}


      {/* SHARE */}

      {pdfUri && (

        <TouchableOpacity
          style={styles.shareButton}
          onPress={() =>
            void shareReport()
          }
        >

          <Text
            style={
              styles.shareButtonText
            }
          >
            Share / Save PDF
          </Text>

        </TouchableOpacity>

      )}

    </ScrollView>

  );
}


const styles = StyleSheet.create({

  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#ffffff',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },

  description: {
    marginTop: 8,
    marginBottom: 24,
    color: '#666666',
  },

  card: {
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  label: {
    marginTop: 8,
    fontSize: 12,
    color: '#666666',
  },

  value: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '600',
  },

  info: {
    marginTop: 5,
  },

  attendance: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
  },

  intake: {
    fontWeight: 'bold',
    marginBottom: 5,
  },

  generateButton: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#111111',
    alignItems: 'center',
    marginBottom: 20,
  },

  generateButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },

  disabledButton: {
    opacity: 0.6,
  },

  shareButton: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#111111',
    alignItems: 'center',
  },

  shareButtonText: {
    fontWeight: 'bold',
  },

});