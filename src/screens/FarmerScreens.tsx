import { createContext, useContext, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BrandMark, Field, InlineMessage, PrimaryButton, ScreenIntro, ScreenLayout, SecondaryButton, TextButton } from '../components/PhaseOneUI';
import { useAuth } from '../hooks/useAuth';
import type { FarmerStackParamList } from '../navigation/FarmerNavigator';

interface FarmerDraft {
  fullName: string;
  farmerId: string;
  mobileNumber: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  crops: string;
}

const initialDraft: FarmerDraft = {
  fullName: '', farmerId: '', mobileNumber: '', state: '', district: '', taluka: '', village: '', crops: '',
};

const FarmerDraftContext = createContext<{
  draft: FarmerDraft;
  update: (values: Partial<FarmerDraft>) => void;
}>({ draft: initialDraft, update: () => undefined });

export function FarmerDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  return <FarmerDraftContext.Provider value={{ draft, update: (values) => setDraft((current) => ({ ...current, ...values })) }}>{children}</FarmerDraftContext.Provider>;
}

function useFarmerDraft() {
  return useContext(FarmerDraftContext);
}

export function FarmerPersonalScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'Personal'>) {
  const { draft, update } = useFarmerDraft();
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const next = () => {
    if (!draft.fullName.trim() || !/^\d{11}$/.test(draft.farmerId)) {
      setMessage('Enter your full name and an 11-digit Farmer ID.');
      return;
    }
    navigation.navigate('FarmDetails');
  };

  return <OnboardingLayout step={1} title="Create Your Profile" subtitle="Let's set up your farmer profile.">
    <SectionTitle title="Personal Details" subtitle="Tell us a bit about yourself." />
    <Pressable accessibilityRole="button" style={styles.photo}><Text style={styles.photoIcon}>＋</Text><Text style={styles.photoText}>Add Photo</Text></Pressable>
    <Field label="Full Name *" placeholder="Enter your full name" value={draft.fullName} onChangeText={(value) => update({ fullName: value })} />
    <Field label="Farmer ID (11 digits) *" placeholder="Enter 11 digit Farmer ID" keyboardType="number-pad" autoCapitalize="none" value={draft.farmerId} onChangeText={(value) => update({ farmerId: value.replace(/\D/g, '').slice(0, 11) })} />
    <Field label="Mobile Number *" placeholder={user?.phone ?? 'Authenticated phone number'} value={draft.mobileNumber || user?.phone || ''} onChangeText={(value) => update({ mobileNumber: value })} keyboardType="phone-pad" autoCapitalize="none" />
    {message && <InlineMessage>{message}</InlineMessage>}
    <InfoCard title="Your information is safe with us" body="We use your details only for verification and to improve your farming experience." />
    <PrimaryButton label="Next  →" onPress={next} />
  </OnboardingLayout>;
}

export function FarmerDetailsScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'FarmDetails'>) {
  const { draft, update } = useFarmerDraft();
  const [message, setMessage] = useState<string | null>(null);
  const next = () => {
    if (![draft.state, draft.district, draft.taluka, draft.village, draft.crops].every((value) => value.trim())) {
      setMessage('Complete all farm details to continue.');
      return;
    }
    navigation.navigate('Review');
  };

  return <OnboardingLayout step={2} title="Farm Details" subtitle="Tell us about your farm.">
    <SectionTitle title="Farm Details" subtitle="Help us understand where you grow." />
    <Field label="State *" placeholder="Select state" value={draft.state} onChangeText={(value) => update({ state: value })} />
    <Field label="District *" placeholder="Select district" value={draft.district} onChangeText={(value) => update({ district: value })} />
    <Field label="Taluka / Tehsil *" placeholder="Select taluka / tehsil" value={draft.taluka} onChangeText={(value) => update({ taluka: value })} />
    <Field label="Village *" placeholder="Select village" value={draft.village} onChangeText={(value) => update({ village: value })} />
    <Field label="Main Crops Grown *" placeholder="Enter main crops" value={draft.crops} onChangeText={(value) => update({ crops: value })} />
    {message && <InlineMessage>{message}</InlineMessage>}
    <InfoCard title="Why is this important?" body="This information helps connect you with the right buyers and provide better market insights." />
    <View style={styles.buttonRow}><SecondaryButton label="←  Back" onPress={() => navigation.goBack()} /><View style={styles.buttonGrow}><PrimaryButton label="Next  →" onPress={next} /></View></View>
  </OnboardingLayout>;
}

export function FarmerReviewScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'Review'>) {
  const { draft } = useFarmerDraft();
  return <OnboardingLayout step={3} title="Review Your Details" subtitle="Please review your information before submitting for verification.">
    <ReviewCard title="Personal Details" onEdit={() => navigation.navigate('Personal')} rows={[["Full Name", draft.fullName], ["Farmer ID", draft.farmerId], ["Mobile Number", draft.mobileNumber]]} />
    <ReviewCard title="Farm Details" onEdit={() => navigation.navigate('FarmDetails')} rows={[["State", draft.state], ["District", draft.district], ["Taluka / Tehsil", draft.taluka], ["Village", draft.village], ["Main Crops Grown", draft.crops]]} />
    <InfoCard title="Your information will be verified" body="Our team will review your details and notify you when the verification process is complete." />
    <PrimaryButton label="Submit for Verification  →" onPress={() => navigation.navigate('Submitted')} />
    <SecondaryButton label="←  Back" onPress={() => navigation.goBack()} />
  </OnboardingLayout>;
}

export function ProfileSubmittedScreen({ navigation }: NativeStackScreenProps<FarmerStackParamList, 'Submitted'>) {
  const { logout } = useAuth();
  return <ScreenLayout><View style={styles.submitted}><BrandMark /><Text style={styles.check}>✓</Text><Text style={styles.submittedTitle}>Profile Submitted!</Text><Text style={styles.submittedCopy}>Your farmer profile has been submitted for verification.</Text><InfoCard title="What's Next?" body="Our team will review your details and notify you once your account is approved." /><PrimaryButton label="Go to Login  →" onPress={() => void logout()} /><TextButton label="Together for a Better Tomorrow" onPress={() => undefined} /></View></ScreenLayout>;
}

function OnboardingLayout({ step, title, subtitle, children }: { step: number; title: string; subtitle: string; children: React.ReactNode }) {
  return <ScreenLayout><BrandMark /><ScreenIntro title={title} description={subtitle} /><View style={styles.stepper}>{['Personal', 'Farm Details', 'Review'].map((label, index) => <View key={label} style={styles.step}><View style={[styles.stepDot, index + 1 <= step && styles.stepDotActive]}><Text style={styles.stepNumber}>{index + 1}</Text></View><Text style={styles.stepLabel}>{label}</Text></View>)}</View><View style={styles.form}>{children}</View></ScreenLayout>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) { return <View><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text></View>; }
function InfoCard({ title, body }: { title: string; body: string }) { return <View style={styles.infoCard}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoBody}>{body}</Text></View>; }
function ReviewCard({ title, rows, onEdit }: { title: string; rows: string[][]; onEdit: () => void }) { return <View style={styles.reviewCard}><View style={styles.reviewHeader}><Text style={styles.sectionTitle}>{title}</Text><TextButton label="Edit" onPress={onEdit} /></View>{rows.map(([label, value]) => <View key={label} style={styles.reviewRow}><Text style={styles.reviewLabel}>{label}</Text><Text style={styles.reviewValue}>{value || 'Not provided'}</Text></View>)}</View>; }

const styles = StyleSheet.create({
  form: { gap: 16 },
  photo: { alignItems: 'center', alignSelf: 'flex-end', backgroundColor: '#EEF2DE', borderRadius: 44, height: 88, justifyContent: 'center', marginTop: -44, width: 88 },
  photoIcon: { color: '#39733C', fontSize: 28 }, photoText: { color: '#53645A', fontSize: 11 },
  sectionTitle: { color: '#23412D', fontSize: 18, fontWeight: '700' }, sectionSubtitle: { color: '#53645A', fontSize: 14, marginTop: 3 },
  infoCard: { backgroundColor: '#EEF2DE', borderColor: '#D5DFC0', borderRadius: 10, padding: 14 }, infoTitle: { color: '#23412D', fontSize: 15, fontWeight: '700' }, infoBody: { color: '#53645A', fontSize: 13, lineHeight: 19, marginTop: 5 },
  buttonRow: { flexDirection: 'row', gap: 10 }, buttonGrow: { flex: 1 },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }, step: { alignItems: 'center', flex: 1 }, stepDot: { alignItems: 'center', backgroundColor: '#E5E9E3', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 }, stepDotActive: { backgroundColor: '#39733C' }, stepNumber: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' }, stepLabel: { color: '#53645A', fontSize: 11, marginTop: 5 },
  reviewCard: { backgroundColor: '#FFFFFF', borderColor: '#E0E6DB', borderRadius: 12, borderWidth: 1, padding: 15 }, reviewHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 }, reviewLabel: { color: '#53645A', flex: 1, fontSize: 13 }, reviewValue: { color: '#23412D', flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  submitted: { alignItems: 'center', gap: 18, justifyContent: 'center', minHeight: 620 }, check: { alignItems: 'center', backgroundColor: '#39733C', borderRadius: 48, color: '#FFFFFF', fontSize: 56, height: 96, lineHeight: 92, overflow: 'hidden', textAlign: 'center', width: 96 }, submittedTitle: { color: '#23412D', fontSize: 32, fontWeight: '700' }, submittedCopy: { color: '#53645A', fontSize: 17, textAlign: 'center' },
});
