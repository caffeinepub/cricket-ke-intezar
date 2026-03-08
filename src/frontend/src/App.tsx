import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart2,
  Crown,
  Eye,
  Flame,
  Heart,
  Lock,
  LogIn,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  type TrendingItem,
  useAddTrendingItem,
  useDeleteTrendingItem,
  useGetTrendingItems,
  useIncrementViews,
  useIsAdmin,
  useLikeItem,
} from "./hooks/useQueries";

/* ────────────────────────────────────────────────── */
/* Constants                                          */
/* ────────────────────────────────────────────────── */

// Category values used for backend filtering (English)
const CATEGORY_VALUES = [
  "All",
  "News",
  "Entertainment",
  "Technology",
  "Sports",
  "Social",
] as const;
type Category = (typeof CATEGORY_VALUES)[number];

// Urdu labels for display
const CAT_LABELS: Record<Category, string> = {
  All: "سب",
  News: "خبریں",
  Entertainment: "تفریح",
  Technology: "ٹیکنالوجی",
  Sports: "کھیل",
  Social: "سوشل",
};

const CAT_CLASS: Record<string, string> = {
  News: "cat-news",
  Entertainment: "cat-entertainment",
  Technology: "cat-technology",
  Sports: "cat-sports",
  Social: "cat-social",
};

/* ────────────────────────────────────────────────── */
/* Helpers                                            */
/* ────────────────────────────────────────────────── */
function fmt(n: bigint): string {
  const v = Number(n);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

/* ────────────────────────────────────────────────── */
/* Fire Particles                                     */
/* ────────────────────────────────────────────────── */
function FireParticles({ count = 18 }: { count?: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${5 + ((i * 5.5) % 90)}%`,
      bottom: `${(i * 7) % 35}%`,
      size: 4 + ((i * 3) % 10),
      duration: 2.5 + ((i * 0.4) % 3),
      delay: (i * 0.25) % 3,
      anim: `float-particle-${(i % 4) + 1}`,
      opacity: 0.5 + ((i * 0.05) % 0.4),
    }));
  }, [count]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="fire-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `${p.anim} ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────── */
/* Count-Up                                           */
/* ────────────────────────────────────────────────── */
function CountUp({
  target,
  duration = 1800,
}: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - pct) ** 3;
      setValue(Math.round(eased * target));
      if (pct < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return <>{value.toLocaleString()}</>;
}

/* ────────────────────────────────────────────────── */
/* Category Badge                                     */
/* ────────────────────────────────────────────────── */
function CatBadge({ category }: { category: string }) {
  const cls = CAT_CLASS[category] ?? "cat-other";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
    >
      {CAT_LABELS[category as Category] ?? category}
    </span>
  );
}

/* ────────────────────────────────────────────────── */
/* Heat Bar                                           */
/* ────────────────────────────────────────────────── */
function HeatBar({
  score,
  showLabel = true,
}: { score: bigint; showLabel?: boolean }) {
  const pct = Math.min(100, Math.max(0, Number(score)));
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="w-3 h-3 text-primary" />
            گرم اسکور
          </span>
          <span className="text-xs font-bold text-primary">{pct}</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
        <motion.div
          className="h-full heat-bar rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────── */
/* Like Button                                        */
/* ────────────────────────────────────────────────── */
function LikeButton({
  itemId,
  count,
  markerIndex,
  onLike,
  isLoading,
  size = "sm",
}: {
  itemId: bigint;
  count: bigint;
  markerIndex: number;
  onLike: (id: bigint) => void;
  isLoading: boolean;
  size?: "sm" | "md";
}) {
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;
    setLiked(true);
    setBurst(true);
    setTimeout(() => setBurst(false), 500);
    onLike(itemId);
  };

  return (
    <button
      type="button"
      data-ocid={`trending.like_button.${markerIndex}`}
      onClick={handleClick}
      disabled={isLoading}
      className={`flex items-center gap-1.5 rounded-full transition-all duration-200 font-medium
        ${size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"}
        ${
          liked
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-muted/60 text-muted-foreground border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
        }`}
    >
      <Heart
        className={`${size === "md" ? "w-4 h-4" : "w-3.5 h-3.5"} transition-all duration-200
          ${liked ? "fill-red-400 text-red-400" : ""}
          ${burst ? "like-pulse" : ""}
        `}
      />
      <span>{fmt(count)}</span>
    </button>
  );
}

/* ────────────────────────────────────────────────── */
/* #1 Spotlight Card                                  */
/* ────────────────────────────────────────────────── */
function SpotlightCard({
  item,
  onView,
  onLike,
  likeLoading,
}: {
  item: TrendingItem;
  onView: (id: bigint) => void;
  onLike: (id: bigint) => void;
  likeLoading: boolean;
}) {
  return (
    <motion.article
      data-ocid="trending.item.1"
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative rounded-2xl overflow-hidden cursor-pointer group border-l-fire hero-card glow-fire-hover mb-6"
      onClick={() => onView(item.id)}
      aria-label={`نمبر 1 ٹرینڈنگ: ${item.title}`}
      dir="rtl"
    >
      {/* Background rank number watermark */}
      <span
        className="rank-bg-number select-none"
        style={{ left: "1rem", top: "50%", transform: "translateY(-50%)" }}
        aria-hidden
      >
        1
      </span>

      <div className="relative p-6 md:p-8 lg:p-10">
        {/* Top badges row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="rank-gold w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-base shadow-fire-sm animate-rank-bounce flex-shrink-0">
            🥇
          </div>
          <span className="badge-trending flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
            <Flame className="w-3 h-3 animate-ember-pulse" />
            ابھی ٹرینڈنگ
          </span>
          <CatBadge category={item.category} />
        </div>

        {/* Title */}
        <h2 className="font-display font-black text-2xl md:text-3xl lg:text-4xl text-foreground mb-3 leading-tight group-hover:text-gradient-fire transition-all duration-300 max-w-3xl">
          {item.title}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed line-clamp-3 mb-6 max-w-2xl">
          {item.description}
        </p>

        {/* Heat bar */}
        <div className="w-full md:max-w-sm mb-6">
          <HeatBar score={item.trendingScore} />
        </div>

        {/* Stats + like row */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="w-4 h-4 text-primary/70" />
            <strong className="text-foreground font-semibold">
              {fmt(item.views)}
            </strong>
            <span>مناظر</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BarChart2 className="w-4 h-4 text-primary/70" />
            <strong className="text-foreground font-semibold">
              {Number(item.trendingScore)}
            </strong>
            <span>گرمی</span>
          </span>
          <LikeButton
            itemId={item.id}
            count={item.likes}
            markerIndex={1}
            onLike={onLike}
            isLoading={likeLoading}
            size="md"
          />
          <div className="flex items-center gap-1 text-xs text-primary/80 font-medium mr-auto">
            <Crown className="w-3.5 h-3.5" />
            <span>نمبر 1 ٹرینڈنگ</span>
          </div>
        </div>
      </div>

      {/* Bottom orange glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.72 0.18 45 / 0.6), transparent)",
        }}
        aria-hidden
      />
    </motion.article>
  );
}

/* ────────────────────────────────────────────────── */
/* Medium Card (#2 / #3)                              */
/* ────────────────────────────────────────────────── */
function MediumCard({
  item,
  rank,
  index,
  onView,
  onLike,
  likeLoading,
}: {
  item: TrendingItem;
  rank: number;
  index: number;
  onView: (id: bigint) => void;
  onLike: (id: bigint) => void;
  likeLoading: boolean;
}) {
  const rankEl =
    rank === 2 ? (
      <div className="rank-silver w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0">
        🥈
      </div>
    ) : (
      <div className="rank-bronze w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0">
        🥉
      </div>
    );

  return (
    <motion.article
      data-ocid={`trending.item.${index + 1}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.45 }}
      className="relative heat-card rounded-xl p-5 cursor-pointer group glow-fire-hover transition-transform duration-200 hover:scale-[1.02] flex flex-col"
      onClick={() => onView(item.id)}
      aria-label={`#${rank} ٹرینڈنگ: ${item.title}`}
      dir="rtl"
    >
      {/* Rank watermark */}
      <span
        className="rank-bg-number select-none"
        style={{
          left: "0.5rem",
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: "5rem",
        }}
        aria-hidden
      >
        {rank}
      </span>

      <div className="flex items-start gap-3 mb-3 relative">
        {rankEl}
        <div className="flex-1 min-w-0">
          <CatBadge category={item.category} />
          <h3 className="font-display font-bold text-lg text-foreground mt-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
            {item.title}
          </h3>
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed relative">
        {item.description}
      </p>

      <div className="mt-auto space-y-3 relative">
        <HeatBar score={item.trendingScore} />
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            {fmt(item.views)}
          </span>
          <LikeButton
            itemId={item.id}
            count={item.likes}
            markerIndex={rank}
            onLike={onLike}
            isLoading={likeLoading}
          />
        </div>
      </div>
    </motion.article>
  );
}

/* ────────────────────────────────────────────────── */
/* List Row Card (#4+)                                */
/* ────────────────────────────────────────────────── */
function ListCard({
  item,
  rank,
  index,
  onView,
  onLike,
  likeLoading,
}: {
  item: TrendingItem;
  rank: number;
  index: number;
  onView: (id: bigint) => void;
  onLike: (id: bigint) => void;
  likeLoading: boolean;
}) {
  return (
    <motion.article
      data-ocid={`trending.item.${index + 1}`}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.5), duration: 0.35 }}
      className="heat-card rounded-xl p-4 cursor-pointer group glow-fire-hover transition-all duration-200 hover:scale-[1.01]"
      onClick={() => onView(item.id)}
      aria-label={`#${rank} ٹرینڈنگ: ${item.title}`}
      dir="rtl"
    >
      <div className="flex items-center gap-4">
        {/* Rank number */}
        <div className="flex-shrink-0 w-10 text-center">
          <span className="font-display font-black text-xl text-gradient-fire leading-none">
            #{rank}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-display font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 text-base leading-snug">
              {item.title}
            </h3>
            <CatBadge category={item.category} />
          </div>

          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {item.description}
          </p>

          {/* Compact heat + stats row */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-[140px]">
              <HeatBar score={item.trendingScore} showLabel={false} />
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              {fmt(item.views)}
            </span>
            <LikeButton
              itemId={item.id}
              count={item.likes}
              markerIndex={rank}
              onLike={onLike}
              isLoading={likeLoading}
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ────────────────────────────────────────────────── */
/* Skeleton                                           */
/* ────────────────────────────────────────────────── */
function SkeletonHero() {
  return (
    <div
      data-ocid="trending.loading_state"
      className="rounded-2xl p-8 border border-border/50 mb-6 shimmer-skeleton"
    >
      <div className="h-5 w-32 rounded-full shimmer-skeleton mb-4" />
      <div className="h-8 w-3/4 rounded shimmer-skeleton mb-3" />
      <div className="h-4 w-full rounded shimmer-skeleton mb-2" />
      <div className="h-4 w-2/3 rounded shimmer-skeleton mb-6" />
      <div className="h-1.5 w-48 rounded-full shimmer-skeleton" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="heat-card rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full shimmer-skeleton flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded shimmer-skeleton" />
          <div className="h-3 w-full rounded shimmer-skeleton" />
          <div className="h-3 w-1/2 rounded shimmer-skeleton" />
          <div className="h-1.5 w-full rounded-full shimmer-skeleton mt-3" />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────── */
/* Package Panels                                     */
/* ────────────────────────────────────────────────── */
function PackagePanels() {
  const [silverAmount, setSilverAmount] = useState("");
  const [goldAmount, setGoldAmount] = useState("");

  const silverProfit = silverAmount
    ? Math.floor(Number.parseFloat(silverAmount) * 0.01)
    : null;
  const goldProfit = goldAmount
    ? Math.floor(Number.parseFloat(goldAmount) * 0.02)
    : null;

  return (
    <section
      data-ocid="packages.section"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-10"
      dir="rtl"
    >
      {/* Section heading */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <Crown className="w-5 h-5 text-primary" />
        <h2 className="font-display font-black text-2xl text-gradient-fire">
          ہمارے پیکیجز
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Package 1 - Silver */}
        <motion.div
          data-ocid="packages.basic.card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="heat-card rounded-2xl p-6 flex flex-col gap-5 glow-fire-hover"
        >
          {/* Icon + Badge row */}
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-muted/60 border border-border text-muted-foreground">
              اسٹارٹر
            </span>
          </div>

          {/* Package name */}
          <div>
            <h3 className="font-display font-black text-xl text-foreground mb-1">
              🥈 سلور پیکیج
            </h3>
            <p className="text-sm text-muted-foreground">
              سرمایہ کاری:{" "}
              <span className="text-foreground font-semibold">
                ۱,۰۰۰ سے ۵۰,۰۰۰ روپے
              </span>
            </p>
          </div>

          {/* Profit percentage */}
          <div className="flex items-end gap-2">
            <span className="font-display font-black text-4xl text-gradient-fire">
              1%
            </span>
            <span className="text-muted-foreground text-sm pb-1">
              منافع ہفتہ وار
            </span>
          </div>

          {/* Example */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              مثال: <span className="text-foreground">10,000 روپے</span> سرمایہ
              کاری پر{" "}
              <span className="text-primary font-semibold">100 روپے</span> ہفتہ
              وار منافع
            </p>
          </div>

          {/* Calculator */}
          <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-2">
            <p className="text-xs text-muted-foreground font-semibold">
              📊 منافع حساب کریں
            </p>
            <input
              data-ocid="packages.basic.input"
              type="number"
              min="0"
              value={silverAmount}
              onChange={(e) => setSilverAmount(e.target.value)}
              placeholder="سرمایہ رقم درج کریں"
              className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-border/50 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              dir="rtl"
            />
            {silverProfit !== null && !Number.isNaN(silverProfit) && (
              <p className="text-xs font-semibold text-emerald-400">
                ہفتہ وار منافع:{" "}
                <span className="text-base">
                  {silverProfit.toLocaleString()}
                </span>{" "}
                روپے
              </p>
            )}
          </div>

          {/* CTA */}
          <a
            data-ocid="packages.basic.button"
            href="https://wa.me/923046842953?text=السلام%20علیکم%20ملک%20محمد%20آفتاب%20رضا%20صاحب%2C%20میں%20سلور%20پیکیج%20میں%20شامل%20ہونا%20چاہتا%20ہوں"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 font-bold text-sm transition-all duration-200"
          >
            ابھی شامل ہوں
          </a>
        </motion.div>

        {/* Package 2 - Gold */}
        <motion.div
          data-ocid="packages.premium.card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative heat-card rounded-2xl p-6 flex flex-col gap-5 glow-fire-hover"
          style={{
            border: "1px solid oklch(0.72 0.18 45 / 0.40)",
            background:
              "linear-gradient(145deg, oklch(0.16 0.014 35) 0%, oklch(0.12 0.010 28) 100%)",
          }}
        >
          {/* Popular badge */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full text-xs font-bold"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.58 0.22 22), oklch(0.72 0.18 45))",
              color: "oklch(0.06 0.003 30)",
              boxShadow: "0 0 16px oklch(0.72 0.18 45 / 0.50)",
            }}
          >
            🔥 مقبول
          </div>

          {/* Icon + Badge row */}
          <div className="flex items-center justify-between mt-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "oklch(0.72 0.18 45 / 0.20)",
                border: "1px solid oklch(0.72 0.18 45 / 0.40)",
                boxShadow: "0 0 12px oklch(0.72 0.18 45 / 0.30)",
              }}
            >
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: "oklch(0.72 0.18 45 / 0.15)",
                border: "1px solid oklch(0.72 0.18 45 / 0.40)",
                color: "oklch(0.84 0.16 55)",
              }}
            >
              پریمیم
            </span>
          </div>

          {/* Package name */}
          <div>
            <h3 className="font-display font-black text-xl text-foreground mb-1">
              🥇 گولڈ پیکیج
            </h3>
            <p className="text-sm text-muted-foreground">
              سرمایہ کاری:{" "}
              <span className="text-foreground font-semibold">
                ۱,۰۰,۰۰۰ سے ۳,۰۰,۰۰۰ روپے
              </span>
            </p>
          </div>

          {/* Profit percentage */}
          <div className="flex items-end gap-2">
            <span className="font-display font-black text-4xl text-gradient-fire">
              2%
            </span>
            <span className="text-muted-foreground text-sm pb-1">
              منافع ہفتہ وار
            </span>
          </div>

          {/* Example */}
          <div
            className="p-3 rounded-xl"
            style={{
              background: "oklch(0.72 0.18 45 / 0.08)",
              border: "1px solid oklch(0.72 0.18 45 / 0.20)",
            }}
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              مثال: <span className="text-foreground">1,00,000 روپے</span>{" "}
              سرمایہ کاری پر{" "}
              <span className="text-primary font-semibold">2,000 روپے</span>{" "}
              ہفتہ وار منافع
            </p>
          </div>

          {/* Calculator */}
          <div
            className="p-3 rounded-lg space-y-2"
            style={{
              background: "oklch(0.72 0.18 45 / 0.07)",
              border: "1px solid oklch(0.72 0.18 45 / 0.18)",
            }}
          >
            <p className="text-xs text-muted-foreground font-semibold">
              📊 منافع حساب کریں
            </p>
            <input
              data-ocid="packages.premium.input"
              type="number"
              min="0"
              value={goldAmount}
              onChange={(e) => setGoldAmount(e.target.value)}
              placeholder="سرمایہ رقم درج کریں"
              className="w-full px-3 py-2 rounded-lg bg-muted/40 border border-primary/20 text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              dir="rtl"
            />
            {goldProfit !== null && !Number.isNaN(goldProfit) && (
              <p className="text-xs font-semibold text-emerald-400">
                ہفتہ وار منافع:{" "}
                <span className="text-base">{goldProfit.toLocaleString()}</span>{" "}
                روپے
              </p>
            )}
          </div>

          {/* CTA */}
          <a
            data-ocid="packages.premium.button"
            href="https://wa.me/923046842953?text=السلام%20علیکم%20ملک%20محمد%20آفتاب%20رضا%20صاحب%2C%20میں%20گولڈ%20پیکیج%20میں%20شامل%20ہونا%20چاہتا%20ہوں"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-bold transition-all duration-200"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.58 0.22 22), oklch(0.72 0.18 45))",
              color: "oklch(0.06 0.003 30)",
              boxShadow: "0 0 20px oklch(0.72 0.18 45 / 0.40)",
            }}
          >
            ابھی شامل ہوں
          </a>
        </motion.div>
      </div>

      {/* Owner Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-8 flex flex-col items-center gap-3 p-5 rounded-2xl border border-primary/30 bg-muted/20 text-center"
      >
        <div className="flex items-center gap-2.5 text-foreground font-semibold text-sm">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.72 0.18 45 / 0.15)" }}
          >
            💬
          </span>
          <span>رابطہ کریں: ملک محمد آفتاب رضا</span>
        </div>
        <a
          data-ocid="packages.contact.button"
          href="https://wa.me/923046842953"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-black text-lg text-primary hover:text-primary/80 transition-colors duration-200 tracking-wide"
        >
          <span>03046842953</span>
        </a>
        <p className="text-xs text-muted-foreground">
          واٹس ایپ پر رابطہ کریں اور فوری جواب پائیں
        </p>
      </motion.div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/* Admin Panel                                        */
/* ────────────────────────────────────────────────── */
function AdminPanel({
  onClose,
  items,
}: {
  onClose: () => void;
  items: TrendingItem[];
}) {
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCat, setFormCat] = useState("");

  const addItem = useAddTrendingItem();
  const deleteItem = useDeleteTrendingItem();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDesc.trim() || !formCat) return;
    try {
      await addItem.mutateAsync({
        title: formTitle.trim(),
        description: formDesc.trim(),
        category: formCat,
      });
      toast.success("✅ آئٹم کامیابی سے شامل ہوا!");
      setFormTitle("");
      setFormDesc("");
      setFormCat("");
    } catch {
      toast.error("آئٹم شامل کرنے میں ناکامی");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("🗑️ آئٹم حذف ہوا");
    } catch {
      toast.error("آئٹم حذف کرنے میں ناکامی");
    }
  };

  return (
    <motion.aside
      data-ocid="admin.panel"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 220 }}
      className="fixed right-0 top-0 h-full w-full max-w-[420px] glass-admin shadow-2xl z-50 flex flex-col"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display font-bold text-lg text-foreground">
            ایڈمن پینل
          </h2>
        </div>
        <Button
          data-ocid="admin.panel.close_button"
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
          onClick={onClose}
          aria-label="پینل بند کریں"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-fire p-6 space-y-8">
        {/* Add Form */}
        <section>
          <h3 className="font-display font-bold text-base mb-5 text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            نیا آئٹم شامل کریں
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-title"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                عنوان
              </label>
              <Input
                id="admin-title"
                data-ocid="admin.title_input"
                placeholder="ٹرینڈنگ عنوان درج کریں..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/40 focus-visible:border-primary/50"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="admin-desc"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                تفصیل
              </label>
              <Textarea
                id="admin-desc"
                data-ocid="admin.description_input"
                placeholder="تفصیل درج کریں..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/40 focus-visible:border-primary/50 resize-none"
                rows={3}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="admin-cat"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
              >
                زمرہ
              </label>
              <Select value={formCat} onValueChange={setFormCat}>
                <SelectTrigger
                  id="admin-cat"
                  data-ocid="admin.category_select"
                  className="bg-muted/40 border-border text-foreground focus:ring-primary/40"
                >
                  <SelectValue placeholder="زمرہ منتخب کریں..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {CATEGORY_VALUES.filter((c) => c !== "All").map((cat) => (
                    <SelectItem
                      key={cat}
                      value={cat}
                      className="text-foreground focus:bg-primary/15 focus:text-foreground"
                    >
                      {CAT_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              data-ocid="admin.submit_button"
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 h-10 shadow-fire-sm"
              disabled={
                addItem.isPending || !formTitle || !formDesc || !formCat
              }
            >
              {addItem.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  شامل ہو رہا ہے...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  آئٹم شامل کریں
                </>
              )}
            </Button>
          </form>
        </section>

        {/* Items list */}
        <section>
          <h3 className="font-display font-bold text-base mb-4 text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            تمام آئٹمز
            <Badge className="mr-auto bg-muted text-muted-foreground border-0 text-xs">
              {items.length}
            </Badge>
          </h3>
          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">
                ابھی کوئی آئٹم نہیں
              </p>
            )}
            {items.map((item, idx) => (
              <motion.div
                key={item.id.toString()}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50 group"
              >
                <span className="font-display text-xs font-bold text-primary/70 w-6 flex-shrink-0">
                  #{idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title}
                  </p>
                  <CatBadge category={item.category} />
                </div>
                <Button
                  data-ocid={`admin.delete_button.${idx + 1}`}
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleteItem.isPending}
                  aria-label={`حذف کریں ${item.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </motion.aside>
  );
}

/* ────────────────────────────────────────────────── */
/* Hero Section                                       */
/* ────────────────────────────────────────────────── */
function HeroSection({
  totalItems,
  searchQuery,
  onSearchChange,
}: {
  totalItems: number;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "clamp(420px, 56vh, 680px)" }}
      aria-label="ہیرو"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/assets/generated/trending-hero-bg.dim_1920x1080.jpg')",
        }}
        aria-hidden
      />

      {/* Gradient overlays for cinematic depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.08 0.005 30 / 0.5) 0%, oklch(0.08 0.005 30 / 0.75) 50%, oklch(0.08 0.005 30 / 1) 100%)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.08 0.005 30 / 0.6) 0%, transparent 50%, oklch(0.08 0.005 30 / 0.3) 100%)",
        }}
        aria-hidden
      />

      {/* Fire particles */}
      <FireParticles count={22} />

      {/* Noise overlay texture */}
      <div
        className="absolute inset-0 noise-overlay pointer-events-none"
        aria-hidden
      />

      {/* Content */}
      <div
        className="relative flex flex-col items-center justify-center text-center px-4 h-full"
        style={{
          minHeight: "clamp(420px, 56vh, 680px)",
          paddingTop: "80px",
          paddingBottom: "60px",
        }}
        dir="rtl"
      >
        {/* Logo + brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-3 mb-6"
        >
          <div className="relative">
            <img
              src="/assets/generated/trending-logo-transparent.dim_200x200.png"
              alt="رضا کنگ لوگو"
              className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
              style={{
                filter: "drop-shadow(0 0 16px oklch(0.72 0.18 45 / 0.6))",
              }}
            />
            <div
              className="absolute inset-0 rounded-full blur-2xl -z-10"
              style={{ background: "oklch(0.72 0.18 45 / 0.25)" }}
              aria-hidden
            />
          </div>
          <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl text-gradient-fire tracking-tight leading-none">
            رضا کنگ
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-muted-foreground text-base md:text-lg max-w-lg mb-8 leading-relaxed"
        >
          دنیا ابھی کس چیز کی بات کر رہی ہے{" "}
          <span className="text-primary font-semibold">ابھی</span>
        </motion.p>

        {/* Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-center gap-2 mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 border border-border/50 backdrop-blur-sm">
            <Flame className="w-4 h-4 text-primary animate-ember-pulse" />
            <span className="text-sm text-foreground font-semibold">
              <CountUp target={totalItems} /> ٹرینڈنگ موضوعات
            </span>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="relative search-glow rounded-full transition-all duration-300">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              data-ocid="nav.search_input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ٹرینڈنگ موضوعات تلاش کریں..."
              className="pr-11 pl-5 h-12 rounded-full glass-hero text-foreground placeholder:text-muted-foreground border-0 focus-visible:ring-0 text-sm font-medium"
              style={{
                background: "oklch(0.12 0.008 30 / 0.70)",
                backdropFilter: "blur(12px)",
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────── */
/* Navbar                                             */
/* ────────────────────────────────────────────────── */
function Navbar({
  activeCategory,
  onCategoryChange,
  isAdmin,
  onAdminClick,
  identity,
  login,
  clear,
  isLoggingIn,
  isInitializing,
}: {
  activeCategory: Category;
  onCategoryChange: (c: Category) => void;
  isAdmin: boolean;
  onAdminClick: () => void;
  identity: ReturnType<typeof useInternetIdentity>["identity"];
  login: () => void;
  clear: () => void;
  isLoggingIn: boolean;
  isInitializing: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? "glass-nav shadow-glass" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6" dir="rtl">
        {/* Brand + Auth row */}
        <div className="flex items-center justify-between py-3 border-b border-border/30">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0">
              <Flame className="w-6 h-6 text-primary animate-ember-pulse" />
              <div
                className="absolute -inset-1 bg-primary/20 rounded-full blur-md -z-10"
                aria-hidden
              />
            </div>
            <span className="font-display font-black text-lg text-gradient-fire hidden sm:block tracking-tight">
              رضا کنگ
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {identity ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5 text-xs h-8 px-3 rounded-full"
                onClick={clear}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">لاگ آؤٹ</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground gap-1.5 text-xs h-8 px-3 rounded-full"
                onClick={login}
                disabled={isLoggingIn || isInitializing}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">لاگ ان</span>
              </Button>
            )}

            {isAdmin && (
              <Button
                data-ocid="nav.admin_button"
                size="sm"
                onClick={onAdminClick}
                className="bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 gap-1.5 text-xs h-8 px-3 rounded-full"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ایڈمن</span>
              </Button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <nav
          className="flex items-center gap-1 py-2.5 overflow-x-auto scrollbar-hide"
          aria-label="زمرہ فلٹر"
        >
          {CATEGORY_VALUES.map((cat) => (
            <button
              key={cat}
              type="button"
              data-ocid="trending.tab"
              onClick={() => onCategoryChange(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 flex-shrink-0
                ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-fire-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              aria-current={activeCategory === cat ? "true" : undefined}
            >
              {CAT_LABELS[cat]}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────── */
/* Main App                                           */
/* ────────────────────────────────────────────────── */
export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [adminOpen, setAdminOpen] = useState(false);

  const { data: items = [], isLoading } = useGetTrendingItems();
  const { data: isAdmin = false } = useIsAdmin();
  const likeItem = useLikeItem();
  const incrementViews = useIncrementViews();
  const { login, clear, identity, isLoggingIn, isInitializing } =
    useInternetIdentity();

  const filtered = useMemo(() => {
    let list = [...items];
    if (activeCategory !== "All")
      list = list.filter((i) => i.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q),
      );
    }
    return list.sort(
      (a, b) => Number(b.trendingScore) - Number(a.trendingScore),
    );
  }, [items, activeCategory, searchQuery]);

  const handleView = useCallback(
    (id: bigint) => incrementViews.mutate(id),
    [incrementViews],
  );
  const handleLike = useCallback(
    (id: bigint) =>
      likeItem.mutate(id, {
        onError: () => toast.error("لائک کرنے میں ناکامی"),
      }),
    [likeItem],
  );

  const [topItem, ...restItems] = filtered;
  const midItems = restItems.slice(0, 2);
  const listItems = restItems.slice(2);

  return (
    <div className="min-h-screen bg-background font-body">
      <Toaster
        toastOptions={{
          classNames: {
            toast: "bg-card border border-border text-foreground shadow-glass",
            success: "text-emerald-400",
            error: "text-destructive",
          },
        }}
      />

      {/* Navbar */}
      <Navbar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        isAdmin={isAdmin}
        onAdminClick={() => setAdminOpen(true)}
        identity={identity}
        login={login}
        clear={clear}
        isLoggingIn={isLoggingIn}
        isInitializing={isInitializing}
      />

      {/* Hero */}
      <HeroSection
        totalItems={items.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Package Panels */}
      <PackagePanels />

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
          dir="rtl"
        >
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-display font-black text-2xl text-gradient-fire">
            کیا ٹرینڈ کر رہا ہے
          </h2>
          {!isLoading && (
            <span className="mr-auto text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "موضوع" : "موضوعات"}
            </span>
          )}
        </motion.div>

        {/* Loading skeletons */}
        {isLoading && (
          <>
            <SkeletonHero />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="space-y-3">
              {(["sk1", "sk2", "sk3", "sk4", "sk5"] as const).map((k) => (
                <SkeletonCard key={k} />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <motion.div
            data-ocid="trending.empty_state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
            dir="rtl"
          >
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{ background: "oklch(0.18 0.010 30)" }}
            >
              <Flame className="w-10 h-10 text-primary/40" />
            </div>
            <p className="font-display font-bold text-xl text-foreground mb-2">
              ابھی کچھ ٹرینڈنگ نہیں
            </p>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "مختلف الفاظ سے تلاش کریں" : "جلد واپس آئیں"}
            </p>
          </motion.div>
        )}

        {/* #1 Spotlight */}
        {!isLoading && topItem && (
          <SpotlightCard
            item={topItem}
            onView={handleView}
            onLike={handleLike}
            likeLoading={likeItem.isPending}
          />
        )}

        {/* #2 & #3 Side by side */}
        {!isLoading && midItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {midItems.map((item, idx) => (
              <MediumCard
                key={item.id.toString()}
                item={item}
                rank={idx + 2}
                index={idx + 1}
                onView={handleView}
                onLike={handleLike}
                likeLoading={likeItem.isPending}
              />
            ))}
          </div>
        )}

        {/* Remaining list items */}
        {!isLoading && listItems.length > 0 && (
          <div data-ocid="trending.list" className="space-y-3">
            {listItems.map((item, idx) => (
              <ListCard
                key={item.id.toString()}
                item={item}
                rank={idx + 4}
                index={idx + 3}
                onView={handleView}
                onLike={handleLike}
                likeLoading={likeItem.isPending}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 py-10" dir="rtl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="font-display font-black text-sm text-gradient-fire">
                رضا کنگ
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()}. بنایا گیا{" "}
              <Heart className="inline w-3 h-3 text-red-400 fill-red-400 mx-0.5" />{" "}
              کے ذریعے{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Admin overlay */}
      <AnimatePresence>
        {adminOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
              onClick={() => setAdminOpen(false)}
            />
            <AdminPanel onClose={() => setAdminOpen(false)} items={items} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
