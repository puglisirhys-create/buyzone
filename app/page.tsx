export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-5xl font-bold mb-4">
          BuyZone 🚀
        </h1>

        <p className="text-gray-400 mb-10">
          Quietly powerful buy zone alerts.
        </p>

        <div className="bg-zinc-900 rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">
            Watchlist
          </h2>

          <p className="text-gray-500">
            No assets added yet.
          </p>
        </div>

      </div>
    </main>
  );
}