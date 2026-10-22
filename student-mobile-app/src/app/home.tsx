
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "../context/Auth";

import {
  getStudentProfile,
  StudentProfile,
} from "../services/studentProfileAPI";

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [profile, setProfile] =
    useState<StudentProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] =
    useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const sisId = user?.sisId ?? null;

  useEffect(() => {
    if (!sisId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadProfile() {
      setLoading(true);
      setProfileError(null);
      setProfile(null);

      try {
        const result = await getStudentProfile(
          sisId!,
          controller.signal
        );

        if (!controller.signal.aborted) {
          setProfile(result);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setProfileError(
            error instanceof Error
              ? error.message
              : "Unable to load student profile."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => controller.abort();
  }, [sisId, reloadKey]);

  if (!user) {
    return null;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.welcome}>
        Welcome,
      </Text>

      <Text style={styles.name}>
        {profile?.fullName ?? user.name}
      </Text>

      <Text style={styles.email}>
        {user.email}
      </Text>

      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>
          STUDENT PROFILE API — EMULATED DATA
        </Text>
      </View>

      {loading && (
        <View style={styles.infoCard}>
          <ActivityIndicator />
          <Text style={styles.infoText}>
            Loading student profile...
          </Text>
        </View>
      )}

      {profileError && !loading && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>
            Student Profile Unavailable
          </Text>

          <Text style={styles.errorText}>
            {profileError}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              setReloadKey(value => value + 1)
            }
          >
            <Text style={styles.retryText}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {profile && (
        <>
          <Text style={styles.heading}>
            Student Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Student ID"
              value={profile.sisId}
            />

            <InfoRow
              label="Programme"
              value={profile.programme.name}
            />

            <InfoRow
              label="Year of Study"
              value={`Year ${profile.yearOfStudy}`}
            />

            <InfoRow
              label="Semester"
              value={profile.semester}
            />

            <InfoRow
              label="Academic Status"
              value={profile.academicStatus}
            />

            <InfoRow
              label="Student Type"
              value={profile.studentType}
            />

            <InfoRow
              label="Campus"
              value={profile.campus}
            />
          </View>

          <Text style={styles.heading}>
            My Enrolled Units ({profile.enrolments.length})
          </Text>

          {profile.enrolments.map(unit => (
            <View
              key={unit.unitId}
              style={styles.unitCard}
            >
              <Text style={styles.unitCode}>
                {unit.code}
              </Text>

              <Text style={styles.unitName}>
                {unit.name}
              </Text>

              <Text style={styles.unitStatus}>
                {unit.enrolmentStatus}
              </Text>
            </View>
          ))}

          <Text style={styles.heading}>
            Visa Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Visa Status"
              value={profile.visa.status.replace(/_/g, " ")}
            />

            <InfoRow
              label="Expiry Date"
              value={
                profile.visa.expiryDate ??
                "Not applicable"
              }
            />

            <Text style={styles.demoNote}>
              {profile.visa.note}
            </Text>
          </View>
        </>
      )}

      <Text style={styles.heading}>
        Student Portal
      </Text>

      <MenuCard
        title="My Attendance"
        description="View your attendance history and attendance percentage."
        onPress={() => router.push("/attendance")}
      />

      <MenuCard
        title="Scan Attendance QR"
        description="Scan the QR code displayed by your lecturer."
        onPress={() => router.push("/qr")}
      />

      <MenuCard
        title="Visa & Compliance"
        description="View visa information and attendance compliance."
        onPress={() => router.push("/visa")}
      />

      <MenuCard
        title="Attendance Report"
        description="Generate and save your attendance report as a PDF."
        onPress={() => router.push("/attendance-report")}
      />

      <MenuCard
        title="Scan QR Code"
        description="Scan a QR code to perform a specific action."
        onPress={() => router.push("/scan")}
      />

      <TouchableOpacity
        style={styles.signOut}
        onPress={() => void signOut()}
      >
        <Text style={styles.signOutText}>
          Sign Out
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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

function MenuCard({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
    >
      <Text style={styles.cardTitle}>
        {title}
      </Text>

      <Text style={styles.cardDescription}>
        {description}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    padding: 24,
    paddingBottom: 48,
  },

  welcome: {
    fontSize: 16,
    color: "#666",
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },

  email: {
    color: "#666",
    marginTop: 4,
    marginBottom: 16,
  },

  demoBanner: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },

  demoBannerText: {
    color: "#805500",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 15,
  },

  infoCard: {
    backgroundColor: "#f6f7f9",
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
  },

  infoRow: {
    marginBottom: 12,
  },

  infoLabel: {
    fontSize: 12,
    color: "#666",
  },

  infoValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 3,
    color: "#222",
  },

  infoText: {
    textAlign: "center",
    marginTop: 10,
    color: "#555",
  },

  unitCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },

  unitCode: {
    fontSize: 15,
    fontWeight: "bold",
  },

  unitName: {
    fontSize: 14,
    color: "#444",
    marginTop: 5,
  },

  unitStatus: {
    fontSize: 12,
    color: "#247647",
    marginTop: 8,
  },

  demoNote: {
    fontSize: 12,
    color: "#777",
    marginTop: 10,
    lineHeight: 18,
  },

  errorCard: {
    backgroundColor: "#fff0f0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },

  errorTitle: {
    fontWeight: "bold",
    color: "#a00000",
  },

  errorText: {
    marginTop: 8,
    color: "#8a0000",
  },

  retryButton: {
    marginTop: 12,
    backgroundColor: "#222",
    borderRadius: 8,
    padding: 10,
    alignSelf: "flex-start",
  },

  retryText: {
    color: "#fff",
    fontWeight: "600",
  },

  card: {
    padding: 20,
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 15,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  cardDescription: {
    marginTop: 6,
    color: "#555",
    lineHeight: 20,
  },

  signOut: {
    marginTop: 20,
    padding: 16,
    alignItems: "center",
  },

  signOutText: {
    color: "#a00000",
    fontWeight: "600",
  },
});
