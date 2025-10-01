// src/app/chat/ChatViewManager.tsx
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import ChatListPage from './dashboard/page';
import UpdatesPage from './updates/page';
import ChatProfilePage from './profile/page';
import AdminHomePage from './admin/page';

const routes = [
  { path: '/chat/dashboard', Component: ChatListPage },
  { path: '/chat/updates', Component: UpdatesPage },
  { path: '