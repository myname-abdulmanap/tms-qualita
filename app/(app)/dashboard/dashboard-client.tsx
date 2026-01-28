"use client";

import React, { useEffect, useState } from "react";
import { Store, CreditCard, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUi } from "@/lib/ui-store";
import { useRouter } from "next/navigation";

/** ---------- Static gradients map ---------- */
const STAT_GRADIENTS = {
  green: "bg-gradient-to-br from-emerald-400 to-teal-500",
  blue: "bg-gradient-to-br from-blue-400 to-cyan-500",
  violet: "bg-gradient-to-br from-violet-400 to-purple-500",
  amber: "bg-gradient-to-br from-amber-400 to-orange-500",
} as const;

interface DashboardData {
  merchants: number;
  devices: number;
  transactions: number;
  totalAmount: number;
}

export default function DashboardPage() {
  const { darkMode } = useUi();
  const router = useRouter();
  const [data, setData] = useState<DashboardData>({
    merchants: 0,
    devices: 0,
    transactions: 0,
    totalAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard");
        
        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID").format(num);
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? "bg-slate-950"
          : "bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50"
      } transition-colors duration-300`}
    >
      {/* Welcome Card */}
      <Card
        className={`${
          darkMode
            ? "bg-gradient-to-br from-indigo-600 to-purple-700"
            : "bg-gradient-to-br from-indigo-500 to-purple-600"
        } border-0 shadow-xl rounded-3xl mb-6 overflow-hidden`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">
                Welcome Back,
              </h2>
              <h3 className="text-2xl font-semibold text-white/90 mb-3">
                Admin
              </h3>
              <p className="text-sm text-white/70">
                Terminal Management System | Overview & Analytics
              </p>
            </div>

            <div className="relative w-[100px] h-[100px]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={100}
                height={100}
                viewBox="0 0 40 40"
              >
                <g fill="none">
                  <g clipPath="url(#SVGw9scfcdR)">
                    <path
                      fill="#00034a"
                      stroke="#00034a"
                      strokeMiterlimit={10}
                      d="M31.967 2.682c-.441-.484-1.584-.162-2.553.72c-.969.883-1.396 1.99-.955 2.475c.26.286.387.434.648.72c.44.485 1.584.162 2.552-.72c.969-.882 1.396-1.99.955-2.474c-.26-.287-.387-.435-.647-.721Zm.396 4.93c-1.257.37-2.126 1.18-1.94 1.809c.379 1.287 1.885 1.462 3.075 1.11c1.257-.37 2.126-1.179 1.94-1.807c-.383-1.3-1.955-1.442-3.075-1.112Z"
                      strokeWidth={1}
                    />
                    <path
                      fill="#00034a"
                      stroke="#00034a"
                      strokeLinecap="round"
                      strokeMiterlimit={10}
                      d="M34.276 13.098c-.826 0-1.497.67-1.497 1.498c0 .934 1.37 2.314 2.305 2.314c.827 0 1.497-.67 1.497-1.498c0-.934-1.37-2.314-2.305-2.314Z"
                      strokeWidth={1}
                    />
                    <path
                      fill="#9bff00"
                      stroke="#00034a"
                      strokeMiterlimit={10}
                      d="M29.182 12.214a2.73 2.73 0 0 0-2.158-1.38a3.1 3.1 0 0 0-1.352.223a8.98 8.98 0 0 0-3.432-7.03c.185-.3.32-.628.399-.972a1.36 1.36 0 0 0-.564-1.303a1.35 1.35 0 0 0-1.42 0c-.315.26-.587.57-.806.914a13.6 13.6 0 0 0-3.578-.777a13.2 13.2 0 0 0-3.685.252a4 4 0 0 0-.632-1.089a1.33 1.33 0 0 0-1.39-.291a1.36 1.36 0 0 0-.827 1.186c.024.35.103.695.234 1.02a9 9 0 0 0-4.59 6.32A3.2 3.2 0 0 0 4.09 8.84a2.7 2.7 0 0 0-2.363.972c-.476.554-.817 3.578-.972 5.834s-.389 5.337 0 5.96a2.65 2.65 0 0 0 2.178 1.429c.468.031.937-.046 1.37-.224c-.106.955.066 1.92.496 2.78c.361.482.876.825 1.459.973a9.2 9.2 0 0 0 .223 3.364a3.08 3.08 0 0 0 2.47 1.546a3.09 3.09 0 0 0 2.693-1.09c.397-.815.635-1.7.7-2.605l1.682.165l1.682.127a7.1 7.1 0 0 0 .233 2.683a3.208 3.208 0 0 0 5.173.457a9.3 9.3 0 0 0 .797-3.276a2.65 2.65 0 0 0 1.604-.749a4.86 4.86 0 0 0 .972-2.654c.394.252.839.411 1.303.466a2.7 2.7 0 0 0 2.372-.972c.467-.554.817-3.587.972-5.833s.399-5.357.049-5.98z"
                      strokeWidth={1}
                    />
                  </g>
                  <defs>
                    <clipPath id="SVGw9scfcdR">
                      <path fill="#fff" d="M0 0h40v40H0z" />
                    </clipPath>
                  </defs>
                </g>
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card
          className={`${
            darkMode ? "bg-red-900/20 border-red-700" : "bg-red-50 border-red-200"
          } border-2`}
        >
          <CardContent className="p-6">
            <p
              className={`text-center ${
                darkMode ? "text-red-300" : "text-red-600"
              }`}
            >
              Error loading dashboard data: {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              dark={darkMode}
              title="Total Merchants"
              tag="@registered"
              value={formatNumber(data.merchants)}
              icon={Store}
              variant="green"
            />
            <StatCard
              dark={darkMode}
              title="Active Devices"
              tag="@connected"
              value={formatNumber(data.devices)}
              icon={CreditCard}
              variant="blue"
            />
            <StatCard
              dark={darkMode}
              title="Transactions"
              tag="@processed"
              value={formatNumber(data.transactions)}
              icon={TrendingUp}
              variant="violet"
            />
            <StatCard
              dark={darkMode}
              title="Total Revenue"
              tag="@amount"
              value={formatCurrency(data.totalAmount)}
              icon={DollarSign}
              variant="amber"
            />
          </div>

          {/* Summary Card */}
          <Card
            className={`${
              darkMode
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            } shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <CardHeader>
              <CardTitle
                className={`${
                  darkMode ? "text-white" : "text-slate-900"
                } text-xl`}
              >
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryItem
                  dark={darkMode}
                  label="Merchants"
                  value={formatNumber(data.merchants)}
                  description="Total registered merchants"
                  color="green"
                />
                <SummaryItem
                  dark={darkMode}
                  label="Devices"
                  value={formatNumber(data.devices)}
                  description="Active EDC terminals"
                  color="blue"
                />
                <SummaryItem
                  dark={darkMode}
                  label="Transactions"
                  value={formatNumber(data.transactions)}
                  description="Total processed"
                  color="violet"
                />
                <SummaryItem
                  dark={darkMode}
                  label="Revenue"
                  value={formatCurrency(data.totalAmount)}
                  description="Total amount"
                  color="amber"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
            <QuickStatCard
              dark={darkMode}
              title="Average Transaction"
              value={
                data.transactions > 0
                  ? formatCurrency(data.totalAmount / data.transactions)
                  : formatCurrency(0)
              }
              trend="+12.5%"
              trendUp={true}
            />
            <QuickStatCard
              dark={darkMode}
              title="Devices per Merchant"
              value={(data.merchants > 0
                ? (data.devices / data.merchants).toFixed(1)
                : "0.0"
              )}
              trend="+5.2%"
              trendUp={true}
            />
            <QuickStatCard
              dark={darkMode}
              title="Transactions per Device"
              value={(data.devices > 0
                ? (data.transactions / data.devices).toFixed(1)
                : "0.0"
              )}
              trend="+8.3%"
              trendUp={true}
            />
          </div>
        </>
      )}
    </div>
  );
}

/** ---------- Components ---------- */
function StatCard({
  dark,
  title,
  tag,
  value,
  icon: Icon,
  variant = "green",
}: {
  dark: boolean;
  title: string;
  tag: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: keyof typeof STAT_GRADIENTS;
}) {
  const gradient = STAT_GRADIENTS[variant] ?? STAT_GRADIENTS.green;

  return (
    <Card
      className={`${gradient} border-0 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group rounded-2xl`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-semibold text-white/90 mb-0.5">
              {title}
            </h3>
            <p className="text-xs text-white/60">{tag}</p>
          </div>
        </div>
        <p className="text-2xl font-bold text-white mt-3 truncate">{value}</p>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  dark,
  label,
  value,
  description,
  color,
}: {
  dark: boolean;
  label: string;
  value: string;
  description: string;
  color: "green" | "blue" | "violet" | "amber";
}) {
  const colorClasses = {
    green: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    violet: "text-violet-600 dark:text-violet-400",
    amber: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="space-y-2">
      <p
        className={`text-sm font-medium ${
          dark ? "text-slate-400" : "text-slate-600"
        }`}
      >
        {label}
      </p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
      <p
        className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}
      >
        {description}
      </p>
    </div>
  );
}

function QuickStatCard({
  dark,
  title,
  value,
  trend,
  trendUp,
}: {
  dark: boolean;
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
}) {
  return (
    <Card
      className={`${
        dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"
      } shadow-md hover:shadow-lg transition-all duration-300`}
    >
      <CardContent className="p-4">
        <p
          className={`text-sm font-medium mb-2 ${
            dark ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {title}
        </p>
        <div className="flex items-end justify-between">
          <p
            className={`text-2xl font-bold ${
              dark ? "text-white" : "text-slate-900"
            }`}
          >
            {value}
          </p>
          <span
            className={`text-sm font-semibold ${
              trendUp ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}