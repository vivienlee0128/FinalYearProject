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


  // ==========================================
  // GENERATE REPORT
  // ==========================================

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
        '=============================='
      );

      console.log(
        '[REPORT] Student:',
        user.email
      );

      console.log(
        '[REPORT] SIS ID:',
        user.sisId
      );


      // ======================================
      // GET REAL QWICKLY ATTENDANCE
      // ======================================

      const reportData =
        await getAttendanceReport(
          user.sisId
        );


      setReport(reportData);


      // ======================================
      // CONVERT REPORT -> HTML -> PDF
      // ======================================

      const uri =
        await generateAttendancePdf(
          reportData
        );


      setPdfUri(uri);


      console.log(
        '[REPORT] PDF generated:',
        uri
      );

      console.log(
        '=============================='
      );


      Alert.alert(
        'Report Generated',
        'Your attendance report has been generated successfully.'
      );


    } catch (error) {

      console.error(
        '[REPORT] Error:',
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


  // ==========================================
  // SHARE PDF
  // ==========================================

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


  // ==========================================
  // SCREEN
  // ==========================================

  return (

    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >

      <View style={styles.content}>


        {/* ====================================
            TITLE
        ==================================== */}

        <Text style={styles.title}>
          Attendance Report
        </Text>


        <Text style={styles.description}>
          Generate your attendance report
          using your current Qwickly
          attendance records.
        </Text>


        {/* ====================================
            STUDENT
        ==================================== */}

        <View style={styles.card}>

          <Text style={styles.cardTitle}>
            Student Information
          </Text>


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


          <Text style={styles.label}>
            Email
          </Text>

          <Text style={styles.value}>
            {user?.email ?? 'Unavailable'}
          </Text>

        </View>


        {/* ====================================
            GENERATE BUTTON
        ==================================== */}

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

            <View style={styles.loadingRow}>

              <ActivityIndicator
                color="#ffffff"
              />

              <Text
                style={
                  styles.loadingButtonText
                }
              >
                Generating Report...
              </Text>

            </View>

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


        {/* ====================================
            REPORT RESULT
        ==================================== */}

        {report && (

          <>

            {/* REPORT INFORMATION */}

            <View style={styles.card}>

              <Text style={styles.cardTitle}>
                Report Information
              </Text>


              <InfoRow
                label="Reference"
                value={
                  report.report.reference
                }
              />


              <InfoRow
                label="Date"
                value={
                  report.report.date
                }
              />


              <InfoRow
                label="Period"
                value={
                  report.report.period
                }
              />

            </View>


            {/* ==================================
                OVERALL ATTENDANCE
            ================================== */}

            <View style={styles.overallCard}>

              <Text style={styles.overallLabel}>
                Overall Attendance
              </Text>


              <Text
                style={
                  styles.overallPercentage
                }
              >

                {
                  report.attendance
                    .percentage !== null

                    ? `${report.attendance.percentage}%`

                    : 'N/A'
                }

              </Text>


              <Text style={styles.overallStatus}>

                {report.attendance.status}

              </Text>

            </View>


            {/* ==================================
                ATTENDANCE SUMMARY
            ================================== */}

            <Text style={styles.sectionTitle}>
              Attendance Summary
            </Text>


            <View style={styles.statsRow}>

              <StatBox
                label="Present"
                value={
                  report.attendance.present
                }
              />

              <StatBox
                label="Absent"
                value={
                  report.attendance.absent
                }
              />

            </View>


            <View style={styles.statsRow}>

              <StatBox
                label="Excused"
                value={
                  report.attendance.excused
                }
              />

              <StatBox
                label="No Record"
                value={
                  report.attendance.noRecord
                }
              />

            </View>


            <View style={styles.card}>

              <InfoRow
                label="Total Sessions"
                value={
                  String(
                    report.attendance
                      .totalSessions
                  )
                }
              />


              <InfoRow
                label="Counted Sessions"
                value={
                  String(
                    report.attendance
                      .countedSessions
                  )
                }
              />

            </View>


            {/* ==================================
                SESSION DETAILS
            ================================== */}

            <Text style={styles.sectionTitle}>
              Attendance Sessions
            </Text>


            {report.sessions.length === 0 ? (

              <View style={styles.card}>

                <Text style={styles.emptyText}>
                  No attendance sessions
                  are available.
                </Text>

              </View>

            ) : (

              report.sessions.map(
                session => (

                  <View
                    key={
                      session.sessionId
                    }
                    style={
                      styles.sessionCard
                    }
                  >

                    <View
                      style={
                        styles.sessionHeader
                      }
                    >

                      <Text
                        style={
                          styles.sessionTitle
                        }
                      >
                        {session.title}
                      </Text>


                      <Text
                        style={
                          styles.sessionStatus
                        }
                      >
                        {session.status}
                      </Text>

                    </View>


                    <Text
                      style={
                        styles.sessionInfo
                      }
                    >
                      Date:
                      {' '}
                      {
                        formatSessionDate(
                          session.startTime
                        )
                      }
                    </Text>


                    <Text
                      style={
                        styles.sessionInfo
                      }
                    >
                      Session ID:
                      {' '}
                      {session.sessionId}
                    </Text>


                    <Text
                      style={
                        styles.sessionInfo
                      }
                    >
                      Session Method:
                      {' '}
                      {
                        session.method ??
                        'N/A'
                      }
                    </Text>


                    {
                      session.attendanceMethod && (

                        <Text
                          style={
                            styles.sessionInfo
                          }
                        >
                          Attendance Method:
                          {' '}
                          {
                            session
                              .attendanceMethod
                          }
                        </Text>

                      )
                    }

                  </View>

                )
              )

            )}


            {/* ==================================
                PDF READY
            ================================== */}

            {pdfUri && (

              <View style={styles.successCard}>

                <Text style={styles.successTitle}>
                  PDF Ready
                </Text>

                <Text style={styles.successText}>
                  Your attendance report has
                  been generated successfully.
                </Text>

              </View>

            )}


            {/* ==================================
                SHARE
            ================================== */}

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

          </>

        )}

      </View>

    </ScrollView>

  );

}


// ============================================
// INFO ROW
// ============================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {

  return (

    <View style={styles.infoRow}>

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>

    </View>

  );

}


// ============================================
// STAT BOX
// ============================================

function StatBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {

  return (

    <View style={styles.statBox}>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>

    </View>

  );

}


// ============================================
// DATE FORMATTER
// ============================================

function formatSessionDate(
  value: string | null
): string {

  if (!value) {
    return 'N/A';
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return 'N/A';

  }


  return date.toLocaleString(
    'en-MY',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

}


// ============================================
// STYLES
// ============================================

const styles =
  StyleSheet.create({

    container: {

      flexGrow: 1,

      padding: 24,

      backgroundColor:
        '#f5f5f5',

    },


    content: {

      width: '100%',

      maxWidth: 1000,

      alignSelf: 'center',

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

      backgroundColor:
        '#ffffff',

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


    infoRow: {

      flexDirection: 'row',

      justifyContent:
        'space-between',

      paddingVertical: 7,

      borderBottomWidth: 1,

      borderBottomColor:
        '#eeeeee',

    },


    infoLabel: {

      color: '#666666',

    },


    infoValue: {

      fontWeight: '600',

      textAlign: 'right',

      flexShrink: 1,

      marginLeft: 20,

    },


    generateButton: {

      padding: 16,

      borderRadius: 10,

      backgroundColor:
        '#111111',

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


    loadingRow: {

      flexDirection: 'row',

      alignItems: 'center',

      gap: 10,

    },


    loadingButtonText: {

      color: '#ffffff',

      fontWeight: 'bold',

    },


    overallCard: {

      backgroundColor:
        '#ffffff',

      borderRadius: 12,

      padding: 24,

      alignItems: 'center',

      marginBottom: 20,

    },


    overallLabel: {

      fontSize: 14,

      color: '#666666',

    },


    overallPercentage: {

      fontSize: 44,

      fontWeight: 'bold',

      marginVertical: 5,

    },


    overallStatus: {

      fontSize: 16,

      fontWeight: '600',

    },


    sectionTitle: {

      fontSize: 20,

      fontWeight: 'bold',

      marginTop: 5,

      marginBottom: 12,

    },


    statsRow: {

      flexDirection: 'row',

      gap: 12,

      marginBottom: 12,

    },


    statBox: {

      flex: 1,

      backgroundColor:
        '#ffffff',

      borderRadius: 12,

      padding: 18,

      alignItems: 'center',

    },


    statValue: {

      fontSize: 26,

      fontWeight: 'bold',

    },


    statLabel: {

      marginTop: 4,

      color: '#666666',

    },


    sessionCard: {

      backgroundColor:
        '#ffffff',

      borderRadius: 12,

      padding: 16,

      marginBottom: 12,

    },


    sessionHeader: {

      flexDirection: 'row',

      justifyContent:
        'space-between',

      alignItems: 'center',

      marginBottom: 8,

    },


    sessionTitle: {

      fontSize: 16,

      fontWeight: '600',

      flex: 1,

    },


    sessionStatus: {

      fontWeight: '600',

      marginLeft: 10,

    },


    sessionInfo: {

      fontSize: 13,

      color: '#555555',

      marginTop: 3,

    },


    emptyText: {

      color: '#666666',

      textAlign: 'center',

    },


    successCard: {

      backgroundColor:
        '#ffffff',

      borderRadius: 12,

      padding: 18,

      marginTop: 8,

      marginBottom: 12,

    },


    successTitle: {

      fontSize: 16,

      fontWeight: 'bold',

    },


    successText: {

      marginTop: 5,

      color: '#666666',

    },


    shareButton: {

      padding: 16,

      borderRadius: 10,

      borderWidth: 1,

      borderColor:
        '#111111',

      alignItems: 'center',

      marginBottom: 30,

    },


    shareButtonText: {

      fontWeight: 'bold',

    },

  });