
"use client";

import type { AssistantConfig } from "@/types";
import { assistantPurposesConfig } from "@/config/appConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaRobot, FaCommentDots } from "react-icons/fa";
import React from 'react';

interface AssistantNodeViewDialogProps {
  assistant: AssistantConfig;
}

const AssistantNodeViewDialog: React.FC<AssistantNodeViewDialogProps> = ({ assistant }) => {
  const purposes = Array.from(assistant.purposes)
    .map(pid => assistantPurposesConfig.find(p => p.id === pid))
    .filter(p => p);

  const numPurposes = purposes.length;
  const angleStep = numPurposes > 0 ? 360 / numPurposes : 0;
  const radius = numPurposes > 1 ? Math.min(120 + numPurposes * 5, 200) : 0; 
  const nodeSize = 80; 
  const centerNodeSize = 90;

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 min-h-[400px] bg-muted/30 rounded-lg shadow-inner">
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" aria-hidden="true">
        {purposes.map((_, index) => {
          const angle = angleStep * index - 90; 
          const x = radius * Math.cos(angle * Math.PI / 180);
          const y = radius * Math.sin(angle * Math.PI / 180);
          return (
            <line
              key={`line-${index}`}
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${x}px)`}
              y2={`calc(50% + ${y}px)`}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="opacity-70 animate-pulse-slow"
            />
          );
        })}
      </svg>
      
      <div 
        className="absolute top-1/2 left-1/2 bg-card border-2 border-primary rounded-full shadow-xl flex flex-col items-center justify-center p-2 text-center z-10"
        style={{
          width: `${centerNodeSize}px`,
          height: `${centerNodeSize}px`,
          transform: 'translate(-50%, -50%)',
        }}
        title={assistant.name}
      >
        <FaRobot className="h-8 w-8 text-primary mb-1" />
        <span className="text-xs font-semibold text-foreground truncate w-full px-1">{assistant.name}</span>
      </div>

      {purposes.map((purpose, index) => {
        if (!purpose) return null;
        const Icon = purpose.icon || FaCommentDots;
        const angle = angleStep * index - 90; 
        const x = radius * Math.cos(angle * Math.PI / 180);
        const y = radius * Math.sin(angle * Math.PI / 180);
        
        return (
          <div
            key={purpose.id}
            className="absolute bg-card border border-accent rounded-full shadow-lg flex flex-col items-center justify-center p-2 text-center z-10 transition-all duration-300 hover:scale-110 hover:shadow-accent/30"
            style={{
              width: `${nodeSize}px`,
              height: `${nodeSize}px`,
              top: `calc(50% + ${y}px)`,
              left: `calc(50% + ${x}px)`,
              transform: 'translate(-50%, -50%)',
              animation: `fadeInNode 0.5s ${index * 0.1}s ease-out forwards`,
              opacity: 0,
            }}
            title={purpose.name}
          >
            <Icon className="h-6 w-6 text-accent mb-1" />
            <span className="text-xs text-muted-foreground truncate w-full px-1">{purpose.name}</span>
          </div>
        );
      })}
      <style jsx>{`
        .animate-pulse-slow {
          animation: pulse-lines 3s infinite ease-in-out;
        }
        @keyframes pulse-lines {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes fadeInNode {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AssistantNodeViewDialog;
