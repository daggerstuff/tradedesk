import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';

type ReferralData = {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: number;
  freeMonthsEarned: number;
  freeMonthsUsed: number;
  nextReward: { threshold: number; value: number } | null;
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    created_at: string;
  }>;
};

export function ReferralScreen() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const result = await apiFetch('/referrals');
      if (result?.ok !== false) {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    Alert.alert('Copied!', 'Referral link copied to clipboard');
    // In a real app, use expo-clipboard: Clipboard.setString(shareUrl);
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality would use expo-sharing');
    // In a real app, use expo-sharing: Share.share({ url: shareUrl });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load referral data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadReferralData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const freeMonthsAvailable = data.freeMonthsEarned - data.freeMonthsUsed;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="gift" size={32} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Referral Program</Text>
          <Text style={styles.headerSubtitle}>Earn free months by inviting friends</Text>
        </View>
      </View>

      {/* Your Code Card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Referral Code</Text>
        <View style={styles.codeDisplay}>
          <Text style={styles.codeText}>{data.referralCode}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
            <Ionicons name="copy" size={20} color="#4f46e5" />
          </TouchableOpacity>
        </View>
        <View style={styles.codeActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
            <Ionicons name="copy" size={18} color="#4f46e5" />
            <Text style={styles.actionButtonText}>Copy Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleShare}>
            <Ionicons name="share-social" size={18} color="#4f46e5" />
            <Text style={styles.actionButtonText}>Share Link</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rewards Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Rewards</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data.activeReferrals}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data.pendingRewards}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={[styles.statValue, { color: '#7c3aed' }]}>{freeMonthsAvailable}</Text>
            <Text style={[styles.statLabel, { color: '#7c3aed' }]}>Free Months</Text>
          </View>
        </View>
      </View>

      {/* Next Reward */}
      {data.nextReward && (
        <View style={styles.nextRewardCard}>
          <Ionicons name="sparkles" size={24} color="#7c3aed" />
          <View>
            <Text style={styles.nextRewardLabel}>Next Reward</Text>
            <Text style={styles.nextRewardValue}>
              {data.nextReward.value} free month{data.nextReward.value > 1 ? 's' : ''}
              {' '}when your referral subscribes
            </Text>
          </View>
        </View>
      )}

      {/* Referral List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Referred Friends</Text>
          <Text style={styles.sectionCount}>{data.referrals.length} total</Text>
        </View>
        
        {data.referrals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No referrals yet</Text>
            <Text style={styles.emptyText}>
              Share your code with friends. When they sign up and subscribe, you both get rewarded!
            </Text>
          </View>
        ) : (
          <View style={styles.referralList}>
            {data.referrals.map((ref) => (
              <View key={ref.id} style={styles.referralItem}>
                <View style={styles.referralAvatar}>
                  <Text style={styles.referralInitial}>{ref.name?.[0]?.toUpperCase() ?? '?'}</Text>
                </View>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralName}>{ref.name}</Text>
                  <Text style={styles.referralEmail}>{ref.email}</Text>
                  <Text style={styles.referralDate}>
                    {new Date(ref.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.referralStatusContainer}>
                  <View style={[
                    styles.referralStatusBadge,
                    {
                      backgroundColor: 
                        ref.status === 'rewarded' ? '#dcfce7' :
                        ref.status === 'subscribed' ? '#dbeafe' :
                        '#fef9c3',
                    }
                  ]}>
                    <Text style={[
                      styles.referralStatusText,
                      {
                        color: 
                          ref.status === 'rewarded' ? '#166534' :
                          ref.status === 'subscribed' ? '#1e40af' :
                          '#854d0e',
                      }
                    ]}>
                      {ref.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.howItWorks}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>1</View>
            <View>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepText}>Send your referral code or link to friends</Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>2</View>
            <View>
              <Text style={styles.stepTitle}>They Sign Up</Text>
              <Text style={styles.stepText}>Friends use your code when creating their account</Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>3</View>
            <View>
              <Text style={styles.stepTitle}>Earn Rewards</Text>
              <Text style={styles.stepText}>Get free months when they subscribe. They get 20% off first 3 months!</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#64748b' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#ef4444', marginBottom: 16 },
  retryButton: { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#0f172a', padding: 24 },
  headerIcon: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 2 },

  codeCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  codeLabel: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  codeDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 12, padding: 16 },
  codeText: { fontSize: 32, fontWeight: '800', color: '#0f172a', letterSpacing: 4, fontFamily: 'monospace' },
  copyButton: { padding: 4 },
  codeActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4f46e5', paddingVertical: 12, borderRadius: 10 },
  actionButtonSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#4f46e5', paddingVertical: 12, borderRadius: 10 },
  actionButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  section: { marginHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionCount: { fontSize: 14, color: '#64748b' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  statCardHighlight: { borderColor: '#7c3aed', borderWidth: 2 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4, textAlign: 'center' },

  nextRewardCard: { marginHorizontal: 16, marginTop: 8, backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#ddd6fe', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextRewardLabel: { fontSize: 13, color: '#7c3aed', fontWeight: '600' },
  nextRewardValue: { fontSize: 15, color: '#5b21b6', fontWeight: '500' },

  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#334155', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },

  referralList: { gap: 12 },
  referralItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  referralAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
  referralInitial: { fontSize: 18, fontWeight: '700', color: '#4f46e5' },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  referralEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  referralDate: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  referralStatusContainer: { alignItems: 'flex-end' },
  referralStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  referralStatusText: { fontSize: 11, fontWeight: '600' },

  howItWorks: { gap: 16 },
  step: { flexDirection: 'row', gap: 12 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  stepText: { fontSize: 13, color: '#64748b', marginTop: 2 },
});