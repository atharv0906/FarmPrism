import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api/api.client';

type MarketplaceSummary = {
  openAuctions?: Array<{
    id: string;
    crop: string;
    quantityKg: number;
    reservePricePerKg: number;
    status?: string;
    farmer?: { name?: string };
  }>;
  activeFixedPriceListings?: Array<{
    id: string;
    crop: string;
    quantityKg: number;
    pricePerKg: number;
    status?: string;
    farmer?: { name?: string };
  }>;
};

type BuyerActivitySummary = {
  activeCurrentBids?: Array<{ id: string; crop: string; quantityKg: number; pricePerKg: number; status?: string }>;
  purchaseRequests?: Array<{ id: string; crop: string; quantityKg: number; requestedAdvancePercent?: number; status?: string }>;
  orders?: Array<{ id: string; crop: string; paymentState?: string; logisticsStatus?: string }>;
};

type LogisticsJobsSummary = {
  availableJobs?: Array<{
    id: string;
    crop: string;
    quantityKg: number;
    pickupSummary?: string;
    deliverySummary?: string;
    status?: string;
  }>;
};

type LogisticsActivitySummary = {
  assignedActiveJobs?: Array<{ id: string; crop: string; status?: string; pickupSummary?: string }>;
  completedHistoryJobs?: Array<{ id: string; crop: string; status?: string }>;
};

function DashboardCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function BuyerDashboardShell() {
  const { demoApiToken } = useAuth();
  const [marketplace, setMarketplace] = useState<MarketplaceSummary | null>(null);
  const [activity, setActivity] = useState<BuyerActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!demoApiToken) {
      setLoading(false);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const [marketplaceData, activityData] = await Promise.all([
          apiClient.get<{ data: MarketplaceSummary }>(`/api/buyer/marketplace`, { bearerToken: demoApiToken }),
          apiClient.get<{ data: BuyerActivitySummary }>(`/api/buyer/activity`, { bearerToken: demoApiToken }),
        ]);

        if (!active) return;
        setMarketplace(marketplaceData.data);
        setActivity(activityData.data);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [demoApiToken]);

  const auctions = marketplace?.openAuctions ?? [];
  const listings = marketplace?.activeFixedPriceListings ?? [];
  const bids = activity?.activeCurrentBids ?? [];
  const orders = activity?.orders ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Buyer Marketplace</Text>
      {loading ? (
        <View style={styles.loading}><ActivityIndicator /></View>
      ) : (
        <>
          <DashboardCard title="Open auctions">
            {auctions.length === 0 ? <Text style={styles.empty}>No open auctions right now.</Text> : auctions.map((auction) => (
              <View key={auction.id} style={styles.row}>
                <Text style={styles.itemTitle}>{auction.crop}</Text>
                <Text style={styles.itemMeta}>{auction.quantityKg} KG • ₹{auction.reservePricePerKg}/KG</Text>
                <Text style={styles.itemMeta}>{auction.farmer?.name ?? 'Farmer'} • {auction.status ?? 'active'}</Text>
              </View>
            ))}
          </DashboardCard>

          <DashboardCard title="Fixed-price listings">
            {listings.length === 0 ? <Text style={styles.empty}>No active fixed-price listings.</Text> : listings.map((listing) => (
              <View key={listing.id} style={styles.row}>
                <Text style={styles.itemTitle}>{listing.crop}</Text>
                <Text style={styles.itemMeta}>{listing.quantityKg} KG • ₹{listing.pricePerKg}/KG</Text>
                <Text style={styles.itemMeta}>{listing.farmer?.name ?? 'Farmer'} • {listing.status ?? 'active'}</Text>
              </View>
            ))}
          </DashboardCard>

          <DashboardCard title="Current bids">
            {bids.length === 0 ? <Text style={styles.empty}>No active bids.</Text> : bids.map((bid) => (
              <View key={bid.id} style={styles.row}>
                <Text style={styles.itemTitle}>{bid.crop}</Text>
                <Text style={styles.itemMeta}>{bid.quantityKg} KG • ₹{bid.pricePerKg}/KG</Text>
                <Text style={styles.itemMeta}>{bid.status ?? 'pending'}</Text>
              </View>
            ))}
          </DashboardCard>

          <DashboardCard title="Orders">
            {orders.length === 0 ? <Text style={styles.empty}>No recent orders.</Text> : orders.map((order) => (
              <View key={order.id} style={styles.row}>
                <Text style={styles.itemTitle}>{order.crop}</Text>
                <Text style={styles.itemMeta}>{order.paymentState ?? 'pending'} • {order.logisticsStatus ?? 'not_assigned'}</Text>
              </View>
            ))}
          </DashboardCard>
        </>
      )}
    </ScrollView>
  );
}

export function LogisticsDashboardShell() {
  const { demoApiToken } = useAuth();
  const [jobs, setJobs] = useState<LogisticsJobsSummary | null>(null);
  const [activity, setActivity] = useState<LogisticsActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!demoApiToken) {
      setLoading(false);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const [jobsData, activityData] = await Promise.all([
          apiClient.get<{ data: LogisticsJobsSummary }>(`/api/logistics/jobs`, { bearerToken: demoApiToken }),
          apiClient.get<{ data: LogisticsActivitySummary }>(`/api/logistics/activity`, { bearerToken: demoApiToken }),
        ]);

        if (!active) return;
        setJobs(jobsData.data);
        setActivity(activityData.data);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [demoApiToken]);

  const liveJobs = jobs?.availableJobs ?? [];
  const activeAssignments = activity?.assignedActiveJobs ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Logistics Console</Text>
      {loading ? (
        <View style={styles.loading}><ActivityIndicator /></View>
      ) : (
        <>
          <DashboardCard title="Available jobs">
            {liveJobs.length === 0 ? <Text style={styles.empty}>No pending pickups.</Text> : liveJobs.map((job) => (
              <View key={job.id} style={styles.row}>
                <Text style={styles.itemTitle}>{job.crop}</Text>
                <Text style={styles.itemMeta}>{job.quantityKg} KG</Text>
                <Text style={styles.itemMeta}>{job.pickupSummary ?? 'Pickup pending'} → {job.deliverySummary ?? 'Delivery pending'}</Text>
              </View>
            ))}
          </DashboardCard>

          <DashboardCard title="Assigned active jobs">
            {activeAssignments.length === 0 ? <Text style={styles.empty}>No active assignments.</Text> : activeAssignments.map((job) => (
              <View key={job.id} style={styles.row}>
                <Text style={styles.itemTitle}>{job.crop}</Text>
                <Text style={styles.itemMeta}>{job.status ?? 'assigned'}</Text>
                <Text style={styles.itemMeta}>{job.pickupSummary ?? 'Pickup in progress'}</Text>
              </View>
            ))}
          </DashboardCard>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F4EA' },
  container: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', color: '#183B2B', marginBottom: 14 },
  loading: { minHeight: 160, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E7E3D5',
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E4631', marginBottom: 8 },
  row: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#EEF2E7' },
  itemTitle: { fontSize: 16, color: '#1B2A22', fontWeight: '700' },
  itemMeta: { fontSize: 13, color: '#4B5A52', marginTop: 2 },
  empty: { color: '#5F6F67', fontSize: 14 },
});