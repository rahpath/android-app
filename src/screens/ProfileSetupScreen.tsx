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
  View,
} from "react-native";

import { GlassButton } from "@/components/glass/GlassButton";
import { GlassContainer } from "@/components/glass/GlassContainer";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassPanel } from "@/components/glass/GlassPanel";
import { AtmosphericScrollView } from "@/components/motion/AtmosphericScrollView";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { useUser } from "@/context";
import { theme } from "@/theme/theme";

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
  return `${`${value.getDate()}`.padStart(2, "0")}/${`${value.getMonth() + 1}`.padStart(2, "0")}/${value.getFullYear()}`;
}

function formatTime(value: Date) {
  return `${`${value.getHours()}`.padStart(2, "0")}:${`${value.getMinutes()}`.padStart(2, "0")}`;
}

export function ProfileSetupScreen() {
  const { user, updateUser } = useUser();
  const [name, setName] = useState("Aryan");
  const [birthDate, setBirthDate] = useState<Date>(new Date(1998, 0, 1));
  const [birthTime, setBirthTime] = useState<Date>(parseStoredTime());
  const [draftBirthDate, setDraftBirthDate] = useState<Date>(new Date(1998, 0, 1));
  const [draftBirthTime, setDraftBirthTime] = useState<Date>(parseStoredTime());
  const [birthLocation, setBirthLocation] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(true);
  const [hasSelectedBirthDate, setHasSelectedBirthDate] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const nextBirthTime = user?.birthTime || "";
    const nextBirthDate = parseStoredDate(user?.birthDate);
    setName(user?.name || "Aryan");
    setBirthDate(nextBirthDate);
    setBirthTime(parseStoredTime(user?.birthTime));
    setDraftBirthDate(nextBirthDate);
    setDraftBirthTime(parseStoredTime(user?.birthTime));
    setBirthLocation(user?.birthLocation || "");
    setTimeUnknown(!nextBirthTime);
    setHasSelectedBirthDate(Boolean(user?.birthDate));
  }, [user]);

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
    <GlassContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <AtmosphericScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <OnboardingProgress stageLabel="Sky" currentStep={1} totalSteps={4} />
          <GlassPanel style={styles.hero}>
            <Text style={styles.kicker}>Sky Setup</Text>
            <Text style={styles.title}>Map the sky you were born under</Text>
            <Text style={styles.subtitle}>
              Your birth details are profile data, not journal entries. They are stored directly so astrology feels real from the start.
            </Text>
          </GlassPanel>

          <GlassPanel style={styles.form}>
            <GlassInput
              value={name}
              onChangeText={setName}
              placeholder="Name"
            />

            <Pressable onPress={() => {
              setDraftBirthDate(birthDate);
              setShowDatePicker(true);
            }}>
              <GlassPanel style={styles.pickerPanel}>
                <Text style={styles.pickerLabel}>Birth date</Text>
                <Text style={styles.pickerValue}>
                  {hasSelectedBirthDate ? formatDateForDisplay(birthDate) : "Select birth date"}
                </Text>
              </GlassPanel>
            </Pressable>

            <Pressable onPress={() => {
              if (timeUnknown) {
                return;
              }
              setDraftBirthTime(birthTime);
              setShowTimePicker(true);
            }}>
              <GlassPanel style={[styles.pickerPanel, timeUnknown && styles.pickerDisabled]}>
                <Text style={styles.pickerLabel}>Birth time</Text>
                <Text style={styles.pickerValue}>{timeUnknown ? "I don't know" : formatTime(birthTime)}</Text>
              </GlassPanel>
            </Pressable>

            <Pressable onPress={() => {
              const nextValue = !timeUnknown;
              setTimeUnknown(nextValue);
            }}>
              <Text style={styles.toggleText}>{timeUnknown ? "Birth time unknown" : "I don't know birth time"}</Text>
            </Pressable>

            <GlassInput
              value={birthLocation}
              onChangeText={setBirthLocation}
              placeholder="Birth city"
            />
            <View style={styles.noteWrap}>
              <Text style={styles.note}>
                Birth time is optional. If you skip it, sign placements still work, but rising sign and houses are held back for honesty.
              </Text>
            </View>
            <GlassButton
              label={isSaving ? "Saving..." : "Save Sky Profile"}
              onPress={handleContinue}
            />
          </GlassPanel>
        </AtmosphericScrollView>
      </KeyboardAvoidingView>

      <Modal
        transparent
        animationType="fade"
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassPanel style={styles.modalPanel}>
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
          </GlassPanel>
        </View>
      </Modal>

      <Modal
        transparent
        animationType="fade"
        visible={showTimePicker}
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassPanel style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Select birth time</Text>
            <DateTimePicker
              value={draftBirthTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
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
          </GlassPanel>
        </View>
      </Modal>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  hero: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.h2,
    fontWeight: "800",
    lineHeight: 30,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  form: {
    gap: theme.spacing.sm,
  },
  pickerPanel: {
    gap: 4,
  },
  pickerDisabled: {
    opacity: 0.7,
  },
  pickerLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
  },
  pickerValue: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
  toggleText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    textAlign: "center",
  },
  noteWrap: {
    marginTop: theme.spacing.xs,
  },
  note: {
    color: theme.colors.secondary,
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalPanel: {
    gap: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.h3,
    fontWeight: "700",
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalActionText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.body,
    fontWeight: "700",
  },
});
