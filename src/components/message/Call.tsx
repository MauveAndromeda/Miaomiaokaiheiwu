'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Avatar } from '@/components/ui';
import { coaches } from '@/data/mock';

export function VoiceCall() {
  const { pageParams, goBack, showToast } = useApp();
  const targetId = pageParams.targetId;
  const coach = coaches.find(c => c.id === targetId);

  const [callStatus, setCallStatus] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  useEffect(() => {
    // 模拟接通
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      const timer = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHangUp = () => {
    setCallStatus('ended');
    showToast('通话已结束', 'info');
    goBack();
  };

  if (!coach) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-background flex flex-col items-center justify-center px-8">
      {/* 头像 */}
      <Avatar
        name={coach.nickname}
        gender={coach.gender}
        size="2xl"
      />

      {/* 昵称 */}
      <h2 className="text-2xl font-bold text-text-primary mt-6 mb-2">
        {coach.nickname}
      </h2>

      {/* 通话状态 */}
      <p className="text-text-secondary mb-8">
        {callStatus === 'calling' && '正在呼叫...'}
        {callStatus === 'connected' && formatDuration(duration)}
        {callStatus === 'ended' && '通话结束'}
      </p>

      {/* 控制按钮 */}
      <div className="flex items-center gap-8">
        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center tap-effect ${
            isMuted ? 'bg-error' : 'bg-surface-light'
          }`}
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <MicOff size={24} className="text-white" />
          ) : (
            <Mic size={24} className="text-text-primary" />
          )}
        </button>

        <button
          className="w-16 h-16 rounded-full bg-error flex items-center justify-center tap-effect"
          onClick={handleHangUp}
        >
          <PhoneOff size={28} className="text-white" />
        </button>

        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center tap-effect ${
            isSpeaker ? 'bg-primary' : 'bg-surface-light'
          }`}
          onClick={() => setIsSpeaker(!isSpeaker)}
        >
          <Volume2 size={24} className={isSpeaker ? 'text-white' : 'text-text-primary'} />
        </button>
      </div>
    </div>
  );
}

export function VideoCall() {
  const { pageParams, goBack, showToast } = useApp();
  const targetId = pageParams.targetId;
  const coach = coaches.find(c => c.id === targetId);

  const [callStatus, setCallStatus] = useState<'calling' | 'connected'>('calling');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);
    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      const timer = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleHangUp = () => {
    showToast('通话已结束', 'info');
    goBack();
  };

  if (!coach) return null;

  return (
    <div className="min-h-screen bg-background relative">
      {/* 对方视频 (模拟) */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
        {callStatus === 'calling' ? (
          <div className="text-center">
            <Avatar name={coach.nickname} gender={coach.gender} size="2xl" />
            <p className="text-text-primary mt-4">正在呼叫...</p>
          </div>
        ) : (
          <Avatar name={coach.nickname} gender={coach.gender} size="2xl" />
        )}
      </div>

      {/* 自己的小窗 */}
      <div className="absolute top-16 right-4 w-24 h-32 bg-surface-light rounded-xl overflow-hidden shadow-lg">
        {isCameraOn ? (
          <div className="w-full h-full bg-gradient-to-br from-surface to-surface-light flex items-center justify-center">
            <span className="text-text-secondary text-xs">我</span>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoOff size={20} className="text-text-secondary" />
          </div>
        )}
      </div>

      {/* 时长 */}
      {callStatus === 'connected' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-1 rounded-full">
          <span className="text-white text-sm">{formatDuration(duration)}</span>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-6 safe-area-inset-bottom">
        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center tap-effect ${
            isMuted ? 'bg-error' : 'bg-white/20'
          }`}
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <MicOff size={24} className="text-white" />
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>

        <button
          className="w-16 h-16 rounded-full bg-error flex items-center justify-center tap-effect"
          onClick={handleHangUp}
        >
          <PhoneOff size={28} className="text-white" />
        </button>

        <button
          className={`w-14 h-14 rounded-full flex items-center justify-center tap-effect ${
            !isCameraOn ? 'bg-error' : 'bg-white/20'
          }`}
          onClick={() => setIsCameraOn(!isCameraOn)}
        >
          {isCameraOn ? (
            <Video size={24} className="text-white" />
          ) : (
            <VideoOff size={24} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
