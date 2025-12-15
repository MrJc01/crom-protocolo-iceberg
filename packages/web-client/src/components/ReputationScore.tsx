/**
 * Reputation Score Component
 * Displays user's trust score and level
 */

import { useState, useEffect } from "react";
import { api } from "@/lib/store";

interface ReputationProps {
  pubkey: string;
  compact?: boolean;
}

interface ReputationData {
  score: number;
  level: "newcomer" | "citizen" | "activist" | "auditor" | "guardian";
  postsCount: number;
  votesReceived: number;
  reportsReceived: number;
}

const LEVELS = {
  newcomer: { min: 0, label: "Novato", icon: "🌱", color: "text-gray-400" },
  citizen: { min: 10, label: "Cidadão", icon: "👤", color: "text-blue-400" },
  activist: { min: 50, label: "Ativista", icon: "✊", color: "text-green-400" },
  auditor: { min: 200, label: "Auditor", icon: "🔍", color: "text-purple-400" },
  guardian: { min: 500, label: "Guardião", icon: "🛡️", color: "text-yellow-400" },
};

function getLevel(score: number): keyof typeof LEVELS {
  if (score >= 500) return "guardian";
  if (score >= 200) return "auditor";
  if (score >= 50) return "activist";
  if (score >= 10) return "citizen";
  return "newcomer";
}

export default function ReputationScore({ pubkey, compact = false }: ReputationProps) {
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReputation();
  }, [pubkey]);

  async function loadReputation() {
    try {
      // Calculate reputation from posts, votes, and reports
      const postsResult = await api.getPosts({ author: pubkey, limit: 1000 });
      const posts = postsResult.posts || [];
      
      let votesReceived = 0;
      let reportsReceived = 0;
      
      posts.forEach((post: any) => {
        if (post.votes) {
          votesReceived += post.votes.up - post.votes.down;
          reportsReceived += post.votes.reports;
        }
      });

      // Calculate score
      const score = Math.max(0, (posts.length * 5) + votesReceived - (reportsReceived * 10));
      
      setData({
        score,
        level: getLevel(score),
        postsCount: posts.length,
        votesReceived,
        reportsReceived,
      });
    } catch (error) {
      console.error("Error loading reputation:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse h-6 bg-gray-700 rounded w-20" />
    );
  }

  if (!data) return null;

  const levelInfo = LEVELS[data.level];

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-1 px-2 py-0.5 bg-gray-800 rounded-full text-xs ${levelInfo.color}`}
        title={`${levelInfo.label} - ${data.score} pts`}
      >
        <span>{levelInfo.icon}</span>
        <span>{data.score}</span>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-secondary">Reputação</h4>
        <span className={`text-2xl ${levelInfo.color}`}>{levelInfo.icon}</span>
      </div>
      
      <div className="text-3xl font-bold mb-1">{data.score}</div>
      <div className={`text-sm ${levelInfo.color}`}>{levelInfo.label}</div>
      
      {/* Progress to next level */}
      <div className="mt-3 space-y-2">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
            style={{ 
              width: `${Math.min(100, (data.score / LEVELS[Object.keys(LEVELS)[Object.keys(LEVELS).indexOf(data.level) + 1] as keyof typeof LEVELS]?.min || 1000) * 100)}%` 
            }}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs text-secondary">
          <div className="text-center">
            <div className="font-medium text-on-surface">{data.postsCount}</div>
            <div>Posts</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-400">+{Math.max(0, data.votesReceived)}</div>
            <div>Votos</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-400">{data.reportsReceived}</div>
            <div>Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
}
