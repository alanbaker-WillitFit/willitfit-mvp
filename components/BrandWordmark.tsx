import React from "react";

export default function BrandWordmark({ className = "" }: { className?: string }) {
  return <span className={`wf-wordmark ${className}`}>Will<span>it</span>Fit</span>;
}
