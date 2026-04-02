import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthArtContainer } from "@/components/auth/AuthArtContainer";
import { useCurrentContext, useUser } from "@/context";
import type { ContextIntent } from "@/types/domain";

const INTENT_OPTIONS: Array<{ label: string; value: ContextIntent }> = [
  { label: "SELF-GROWTH", value: "understand_myself" },
  { label: "RELATIONSHIPS", value: "relationship_clarity" },
  { label: "CAREER", value: "career_direction" },
  { label: "CLARITY", value: "decision_support" },
] as const;

function parseStoredDate(value?: string) {
  if (!value) {
    return new Date(1998, 0, 1);
  }

  const parts = value.split("-").map(Number);
  if (parts.length !== 3) {
    return new Date(1998, 0, 1);
  }

  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function parseStoredTime(value?: string) {
  const base = new Date();
  if (!value) {
    base.setHours(9, 0, 0, 0);
    return base;
  }

  const parts = value.split(":").map(Number);
  base.setHours(parts[0] || 9, parts[1] || 0, 0, 0);
  return base;
}

function formatDateForStorage(value: Date) {
  return `${value.getFullYear()}-${`${value.getMonth() + 1}`.padStart(2, "0")}-${`${value.getDate()}`.padStart(2, "0")}`;
}

function formatDateForDisplay(value: Date) {
  return `${`${value.getMonth() + 1}`.padStart(2, "0")}/${`${value.getDate()}`.padStart(2, "0")}/${value.getFullYear()}`;
}

function formatTime(value: Date) {
  return `${`${value.getHours()}`.padStart(2, "0")}:${`${value.getMinutes()}`.padStart(2, "0")}`;
}

function formatTimeForDisplay(value: Date) {
  return value.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ProfileSetupScreen() {
  const { user, updateUser } = useUser();
  const { currentContext, updateCurrentContext } = useCurrentContext();
  const [name, setName] = useState("Aryan");
  const [birthDate, setBirthDate] = useState<Date>(new Date(1998, 0, 1));
  const [birthTime, setBirthTime] = useState<Date>(parseStoredTime());
  const [draftBirthDate, setDraftBirthDate] = useState<Date>(new Date(1998, 0, 1));
  const [draftBirthTime, setDraftBirthTime] = useState<Date>(parseStoredTime());
  const [birthLocation, setBirthLocation] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [hasSelectedBirthDate, setHasSelectedBirthDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<ContextIntent | "">("");

  useEffect(() => {
    const nextBirthTime = user?.birthTime || "";
    const nextBirthDate = parseStoredDate(user?.birthDate);
    setName(user?.name || "Aryan");
    setBirthDate(nextBirthDate);
    setBirthTime(parseStoredTime(user?.birthTime));
    setDraftBirthDate(nextBirthDate);
    setDraftBirthTime(parseStoredTime(user?.birthTime));
    setBirthLocation(user?.birthLocation || "");
    setTimeUnknown(false);
    setHasSelectedBirthDate(Boolean(user?.birthDate));
    setSelectedIntent(currentContext?.activeIntent || "");
  }, [currentContext?.activeIntent, user]);

  const canContinue = useMemo(
    () => Boolean(name.trim() && birthLocation.trim() && hasSelectedBirthDate),
    [birthLocation, hasSelectedBirthDate, name],
  );

  const handleContinue = async () => {
    if (!canContinue || isSaving) {
      return;
    }

    setIsSaving(true);
    await updateUser({
      name: name.trim(),
      birthDate: formatDateForStorage(birthDate),
      birthTime: timeUnknown ? "" : formatTime(birthTime),
      birthLocation: birthLocation.trim(),
      chartRevealed: false,
      onboardingCompleted: false,
    });

    if (selectedIntent) {
      await updateCurrentContext({
        activeIntent: selectedIntent,
      });
    }

    setIsSaving(false);
    router.push("/chart-reveal");
  };

  const handleDateChange = (event: DateTimePickerEvent, value?: Date) => {
    if (event.type === "dismissed") {
      return;
    }

    if (value) {
      setDraftBirthDate(value);
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, value?: Date) => {
    if (event.type === "dismissed") {
      return;
    }

    if (value) {
      setDraftBirthTime(value);
    }
  };

  return (
    <AuthArtContainer>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.screen}>
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              <View style={styles.fieldShell}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#a8a49a"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
              <Pressable
                onPress={() => {
                  setDraftBirthDate(birthDate);
                  setShowDatePicker(true);
                }}
                style={styles.fieldShell}
              >
                <Text style={[styles.input, !hasSelectedBirthDate && styles.placeholderText]}>
                  {hasSelectedBirthDate ? formatDateForDisplay(birthDate) : "mm/dd/yyyy"}
                </Text>
                <Text style={styles.fieldIcon}>[]</Text>
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>TIME OF BIRTH (OPTIONAL)</Text>
              <Pressable
                onPress={() => {
                  if (timeUnknown) {
                    return;
                  }
                  setDraftBirthTime(birthTime);
                  setShowTimePicker(true);
                }}
                style={[styles.fieldShell, timeUnknown && styles.disabledShell]}
              >
                <Text style={[styles.input, timeUnknown && styles.placeholderText]}>
                  {timeUnknown ? "--:-- --" : formatTimeForDisplay(birthTime)}
                </Text>
                <Text style={styles.fieldIcon}>◷</Text>
              </Pressable>
            </View>

            <Pressable style={styles.unknownToggle} onPress={() => setTimeUnknown((current) => !current)}>
              <View style={[styles.checkCircle, timeUnknown && styles.checkCircleActive]} />
              <Text style={styles.unknownToggleText}>I don't know birth time</Text>
            </Pressable>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>BIRTH CITY</Text>
              <View style={styles.fieldShell}>
                <TextInput
                  value={birthLocation}
                  onChangeText={setBirthLocation}
                  placeholder="Enter your birth city"
                  placeholderTextColor="#a8a49a"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.intentWrap}>
              <Text style={styles.intentTitle}>What brings you here?</Text>
              <View style={styles.chipGrid}>
                {INTENT_OPTIONS.map((option) => {
                  const isActive = selectedIntent === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => setSelectedIntent(option.value)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>{isSaving ? "Saving..." : "Begin Your Journey  ->"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        transparent
        animationType="fade"
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select date of birth</Text>
            <DateTimePicker
              value={draftBirthDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date(1950, 0, 1)}
              maximumDate={new Date(2026, 11, 31)}
              onChange={handleDateChange}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={styles.modalActionText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setBirthDate(draftBirthDate);
                  setHasSelectedBirthDate(true);
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.modalActionText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={showTimePicker}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select birth time</Text>
            <DateTimePicker
              value={draftBirthTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "clock"}
              is24Hour={false}
              onChange={handleTimeChange}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowTimePicker(false)}>
                <Text style={styles.modalActionText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setBirthTime(draftBirthTime);
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.modalActionText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AuthArtContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 150,
    paddingBottom: 14,
  },
  card: {
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "rgba(247, 243, 236, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
    paddingHorizontal: 18,
    paddingVertical: 22,
    shadowColor: "rgba(51, 73, 101, 0.18)",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  fieldLabel: {
    color: "#66747e",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  fieldShell: {
    minHeight: 50,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(229, 223, 214, 0.95)",
    backgroundColor: "rgba(255,255,255,0.5)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabledShell: {
    opacity: 0.72,
  },
  input: {
    color: "#68716f",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  placeholderText: {
    color: "#a8a49a",
  },
  fieldIcon: {
    color: "#52677f",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  unknownToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -4,
  },
  checkCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#8c918d",
    backgroundColor: "transparent",
  },
  checkCircleActive: {
    backgroundColor: "#123765",
    borderColor: "#123765",
  },
  unknownToggleText: {
    color: "#58616a",
    fontSize: 12,
    fontWeight: "600",
  },
  intentWrap: {
    alignItems: "center",
    gap: 14,
    paddingTop: 6,
  },
  intentTitle: {
    color: "#28334c",
    fontSize: 18,
    fontWeight: "500",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  chip: {
    minWidth: 112,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(236, 231, 224, 0.96)",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: "#123765",
    borderColor: "#123765",
  },
  chipText: {
    color: "#677179",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  chipTextActive: {
    color: "#f8f4ee",
  },
  primaryButton: {
    minHeight: 62,
    borderRadius: 0,
    backgroundColor: "#0f2f5b",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    shadowColor: "rgba(15, 47, 91, 0.4)",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  primaryButtonText: {
    color: "#f7f1e8",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(16, 28, 44, 0.28)",
  },
  modalCard: {
    borderRadius: 18,
    backgroundColor: "#f8f5ef",
    padding: 18,
    gap: 16,
  },
  modalTitle: {
    color: "#21324a",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalActionText: {
    color: "#123765",
    fontSize: 15,
    fontWeight: "700",
  },
});
