import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { fetchMyDonations, selectMyDonations, selectDonationLoad } from "@/app/store/donationSlice";
import { formatDate, formatCurrency } from "@/utils/formatters";

// ─── Helper Functions ─────────────────────────
const getDonorName = (donation) => {
  if (donation.isAnonymous) return "Anonymous";
  if (donation.donor?.name) return donation.donor.name;
  if (donation.guestDonorInfo?.name) return donation.guestDonorInfo.name;
  return "Anonymous";
};

const getStatusColor = (status) => {
  switch (status) {
    case "completed": return "bg-green-100 text-green-600";
    case "pending":   return "bg-yellow-100 text-yellow-600";
    case "failed":    return "bg-red-100 text-red-600";
    case "refunded":  return "bg-blue-100 text-blue-600";
    default: return "bg-gray-100 text-gray-600";
  }
};

// ─── Donation Card ─────────────────────────
function DonationCard({ donation }) {
  const donorName = getDonorName(donation);
  const donorEmail = donation.donor?.email || donation.guestDonorInfo?.email || "";
  const donorPhone = donation.donor?.phone || donation.guestDonorInfo?.phone || "";

  return (
    <div className="bg-card p-md rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-200 flex flex-col md:flex-row justify-between items-start mb-sm">
      
      {/* Left: Donor Info */}
      <div className="flex-1 min-w-0">
        <p className="text-text-main font-medium truncate">{donorName}</p>
        {donation.message && (
          <p className="text-text-secondary text-small mt-1 truncate">{donation.message}</p>
        )}
        {(donorEmail || donorPhone) && (
          <p className="text-text-light text-small mt-1 truncate">
            {donorEmail}{donorEmail && donorPhone ? " | " : ""}{donorPhone}
          </p>
        )}
        <p className="text-text-light text-small mt-1">{formatDate(donation.createdAt)}</p>
      </div>

      {/* Right: Amount, Type, Status */}
      <div className="flex flex-col items-end mt-3 md:mt-0 md:ml-4">
        <span className={`px-2 py-1 rounded-md text-small font-medium ${getStatusColor(donation.status)}`}>
          {donation.status}
        </span>
        <p className="text-primary font-bold text-small mt-2">{formatCurrency(donation.amount)}</p>
        <p className="text-text-secondary text-small mt-1 capitalize">{donation.donationType}</p>
        <p className="text-text-secondary text-small mt-1">{donation.paymentMethod}</p>

        {donation.receiptUrl && (
          <a 
            href={donation.receiptUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-1 text-secondary font-medium text-small hover:underline"
          >
            Receipt
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Loading Spinner ─────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-lg">
      <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// ─── Empty State ────────────────────────────
function EmptyState({ message }) {
  return (
    <div className="text-center text-text-secondary py-lg">{message}</div>
  );
}

// ─── Main Profile Donations Component ───────
export default function ProfileDonations() {
  const dispatch = useAppDispatch();
  const donations = useAppSelector(selectMyDonations);
  const loading = useAppSelector(selectDonationLoad);

  useEffect(() => {
    dispatch(fetchMyDonations());
  }, [dispatch]);

  return (
    <div className="page-wrapper p-md">
      <h2 className="font-heading text-h2 text-text-main mb-md">আমার Donations</h2>

      {loading && <LoadingSpinner />}

      {!loading && donations.length === 0 && (
        <EmptyState message="কোনো donation পাওয়া যায়নি।" />
      )}

      {!loading && donations.length > 0 && (
        <div className="space-y-sm">
          {donations.map((d) => (
            <DonationCard key={d._id} donation={d} />
          ))}
        </div>
      )}
    </div>
  );
}