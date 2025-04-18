import Image from "next/image";
import Navigation from '@/components/Navigation';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Hero Section */}
          <section className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Welcome to FlexPrice
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Your flexible pricing solution for modern businesses
            </p>
          </section>

          {/* Scrollable Content */}
          <div className="h-[600px] overflow-y-auto border rounded-lg p-6">
            <div className="space-y-6">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="p-6 bg-white rounded-lg shadow">
                  <h2 className="text-2xl font-semibold text-gray-900">Section {index + 1}</h2>
                  <p className="mt-2 text-gray-600">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
                    nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
