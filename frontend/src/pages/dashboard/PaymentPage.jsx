import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../lib/apiClient';

function PaymentPage() {
  const { orderId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/payments/${orderId}`);
      setPayment(res.data?.data?.payment ?? null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  const createPaymentIntent = async () => {
    setCreating(true);
    setError('');
    setInfo('');
    try {
      const res = await apiClient.post('/payments/create', { orderId });
      const data = res.data?.data;
      setInfo(
        `Payment intent created. Use client secret ${data?.clientSecret} in your Stripe UI integration.`,
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Payment</h1>
        <p className="mt-1 text-sm text-slate-600">
          View payment status for this order and trigger a Stripe payment intent.
        </p>
      </header>
      {loading ? (
        <p className="text-sm text-slate-600">Loading payment status...</p>
      ) : (
        <div className="space-y-3 rounded-lg border bg-white p-4 text-sm shadow-sm">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          {payment ? (
            <dl className="grid gap-2 text-xs text-slate-700 md:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-800">Status</dt>
                <dd className="mt-0.5 capitalize">{payment.status}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Amount</dt>
                <dd className="mt-0.5">₹{payment.amount}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Method</dt>
                <dd className="mt-0.5">{payment.paymentMethod}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-800">Transaction ID</dt>
                <dd className="mt-0.5">{payment.transactionId}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-slate-600">
              No payment record yet for this order. You can create a payment intent below.
            </p>
          )}
          {info && (
            <p className="text-[11px] text-emerald-700" aria-live="polite">
              {info}
            </p>
          )}
          <button
            type="button"
            disabled={creating}
            onClick={createPaymentIntent}
            className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {creating ? 'Creating payment...' : 'Create payment intent'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PaymentPage;


