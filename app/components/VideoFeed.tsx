"use client";

import { IVideo } from "@/models/Video";
import VideoComponent from "./VideoComponent";
import { useEffect, useState } from "react";

interface VideoFeedProps {
  videos: IVideo[];
}

export default function VideoFeed({ videos }: VideoFeedProps) {
  const steps = [
    "First, log in to the application.",
    "On the top-right side, click on the user icon.",
    "From there, log in successfully.",
    "After logging in, create a new video.",
    "You can update the video if you want to make changes.",
    "You can also delete the video when it’s not needed.",
    "Enjoy the whole process 😊",
  ];

  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);

  useEffect(() => {
    if (videos.length === 0) {
      setVisibleSteps([]);
      steps.forEach((step, index) => {
        setTimeout(() => {
          setVisibleSteps((prev) => [...prev, step]);
        }, index * 700);
      });
    }
  }, [videos.length]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <VideoComponent key={video._id?.toString()} video={video} />
      ))}

      {videos.length === 0 && (
        <div className="col-span-full text-center py-12 space-y-2">
          {visibleSteps.map((step, index) => (
            <p key={index} className="text-base-content/70">
              {step}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
