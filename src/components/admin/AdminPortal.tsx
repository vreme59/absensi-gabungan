import React, { useState } from 'react';
import { Header } from './Header';
import { BottomNav, TabType } from './BottomNav';
import { AdminDashboardView } from './AdminDashboardView';
import { JadwalView } from './JadwalView';
import { RekapView } from './RekapView';
import { ProfilView, getUserAvatar } from './ProfilView';
import { ScheduleModal } from './ScheduleModal';
import { AttachmentModal } from './AttachmentModal';
import { NotificationsModal } from './NotificationsModal';
import { PrintModal } from './PrintModal';
import {
  INITIAL_STUDENTS,
  INITIAL_SCHEDULES,
  INITIAL_TEACHERS,
  NOTIFICATIONS,
} from './mockData';
import { Student, ScheduleSlot, NotificationItem, Teacher } from '../../types';
import { exportAttendanceRecapToExcel } from '../../utils/excelHelper';

export interface AdminPortalSession {
  username: string;
  role: 'admin' | 'superadmin' | 'operator';
  nama: string;
}

interface AdminPortalProps {
  session: AdminPortalSession;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ session, onLogout }) => {
  const normalizedRole: 'admin' | 'superadmin' =
    session.role === 'superadmin' ? 'superadmin' : 'admin';

  // ─── NAV STATE ───
  const [currentTab, setCurrentTab] = useState<TabType>('beranda');

  // ─── DATA STATE ───
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [schedules, setSchedules] = useState<ScheduleSlot[]>(INITIAL_SCHEDULES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(NOTIFICATIONS);

  // ─── MODALS ───
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [selectedStudentAttachment, setSelectedStudentAttachment] = useState<Student | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // ─── TOAST ───
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // ─── SCHEDULE CRUD ───
  const handleOpenAddSchedule = () => {
    setEditingSlot(null);
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setIsScheduleModalOpen(true);
  };

  const handleDeleteSchedule = (id: string, subject: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus slot pelajaran "${subject}"?`)) {
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      showToast(`Jadwal "${subject}" berhasil dihapus.`);
    }
  };

  const handleSaveSchedule = (slotData: Partial<ScheduleSlot>) => {
    if (editingSlot) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === editingSlot.id ? { ...s, ...slotData } : s))
      );
      showToast(`Jadwal "${slotData.subject}" berhasil diperbarui!`);
    } else {
      const newSlot: ScheduleSlot = {
        id: `sch-${Date.now()}`,
        day: slotData.day || 'Selasa',
        jpStart: slotData.jpStart || 1,
        jpEnd: slotData.jpEnd || 2,
        jpLabel: slotData.jpLabel || 'JP 1 - 2',
        timeRange: slotData.timeRange || '07:15 - 08:45 WIT',
        subject: slotData.subject || 'Mapel Baru',
        teacher: slotData.teacher || 'Guru Pengampu',
        room: slotData.room || 'Lab Komputer 2',
        badgeType: 'normal',
      };
      setSchedules((prev) => [...prev, newSlot]);
      showToast(`Jadwal baru berhasil ditambahkan!`);
    }
    setIsScheduleModalOpen(false);
  };

  const handleImportSchedules = (newSchedules: ScheduleSlot[]) => {
    setSchedules((prev) => [...prev, ...newSchedules]);
    showToast(`${newSchedules.length} jadwal berhasil diimpor dari file Excel!`);
  };

  const handleImportStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    showToast(`${newStudents.length} data siswa berhasil diimpor dari file Excel!`);
  };

  const handleAddTeacher = (newTeacher: Teacher) => {
    setTeachers((prev) => [newTeacher, ...prev]);
    showToast(`Guru ${newTeacher.name} berhasil ditambahkan!`);
  };

  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
    showToast(`Siswa ${newStudent.name} (${newStudent.kelas || 'Rombel'}) berhasil ditambahkan!`);
  };

  const handleResetUserPassword = (username: string, _newPass: string) => {
    showToast(`Kata sandi akun ${username} berhasil disetel ulang!`);
  };

  // ─── NOTIFICATIONS ───
  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('Semua notifikasi ditandai telah dibaca.');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  // ─── DOWNLOAD RECAP ───
  const handleDownloadRecapPDF = () => {
    exportAttendanceRecapToExcel(students, 'XII TKJ 1', 'Oktober 2026');
    showToast('Rekap presensi berhasil diekspor ke Excel (.xlsx)');
  };

  // ─── HEADER TITLE ───
  const getHeaderTitle = () => {
    if (currentTab === 'jadwal') return 'Jadwal Pelajaran';
    if (currentTab === 'rekap') return 'Rekap Presensi';
    if (currentTab === 'profil') return 'Profil';
    return 'Beranda';
  };

  const handleHeaderBack = () => {
    if (currentTab !== 'beranda') {
      setCurrentTab('beranda');
    }
  };

  const roleTitle =
    normalizedRole === 'superadmin' ? 'Kepala Sekolah / IT Admin' : 'Tata Usaha / Operator';

  return (
    <div className="bg-slate-100 min-h-screen text-[#191c1e] flex flex-col items-center justify-start font-sans selection:bg-[#77b7fe] selection:text-[#00487a]">
      {/* Shell Container: Full-width on mobile, responsive modern adaptive layout on tablet/desktop */}
      <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl min-h-screen bg-[#f7f9fb] shadow-2xl relative flex flex-col transition-all duration-200">
        {/* Top Application Bar */}
        <Header
          title={getHeaderTitle()}
          showBack={currentTab !== 'beranda'}
          onBack={handleHeaderBack}
          onNotificationClick={() => setIsNotificationsOpen(true)}
          onProfileClick={() => setCurrentTab('profil')}
          unreadCount={unreadNotificationsCount}
          avatarUrl={getUserAvatar({ username: session.username, role: normalizedRole, nama: session.nama })}
        />

        {/* Main View Area */}
        <main className="flex-1 flex flex-col relative w-full pt-16">
          {currentTab === 'beranda' ? (
            <AdminDashboardView
              onOpenScheduleManager={handleOpenAddSchedule}
              onOpenPrintModal={() => setIsPrintModalOpen(true)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              roleTitle={roleTitle}
              schedules={schedules}
              students={students}
              teachers={teachers}
              onImportSchedules={handleImportSchedules}
              onImportStudents={handleImportStudents}
              onAddTeacher={handleAddTeacher}
              onAddStudent={handleAddStudent}
              onResetUserPassword={handleResetUserPassword}
            />
          ) : currentTab === 'jadwal' ? (
            <JadwalView
              schedules={schedules}
              onOpenAddModal={handleOpenAddSchedule}
              onOpenEditModal={handleOpenEditSchedule}
              onDeleteSlot={handleDeleteSchedule}
              onPrint={() => setIsPrintModalOpen(true)}
              onOpenAbsensiKelas={() => {}}
              userRole={normalizedRole}
              session={{ username: session.username, role: normalizedRole, nama: session.nama }}
              studentClass="XII TKJ 1"
              onImportSchedules={handleImportSchedules}
            />
          ) : currentTab === 'rekap' ? (
            <RekapView
              onBackToBeranda={() => setCurrentTab('beranda')}
              onDownloadReport={handleDownloadRecapPDF}
              userRole={normalizedRole}
              session={session}
              students={students}
            />
          ) : (
            <ProfilView
              session={{ username: session.username, role: normalizedRole, nama: session.nama }}
              onLogout={onLogout}
              onOpenLencanaModal={() => {}}
              onNavigateToAbsensi={() => {}}
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNav
          activeTab={currentTab}
          userRole={normalizedRole}
          onTabChange={(tab) => setCurrentTab(tab)}
        />

        {/* Logout FAB (visible on profil tab) */}
        {currentTab === 'profil' && (
          <button
            type="button"
            onClick={onLogout}
            className="fixed bottom-24 right-4 z-50 w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 active:scale-90 transition-all cursor-pointer"
            aria-label="Keluar"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </button>
        )}
      </div>

      {/* ─── Modals ─── */}
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        editingSlot={editingSlot}
        onClose={() => setIsScheduleModalOpen(false)}
        onSave={handleSaveSchedule}
      />

      <AttachmentModal
        student={selectedStudentAttachment}
        onClose={() => setSelectedStudentAttachment(null)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        notifications={notifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        userRole={normalizedRole}
        onAddNotification={(newNotif) => {
          setNotifications((prev) => [newNotif, ...prev]);
          showToast('Pemberitahuan berhasil disiarkan!');
        }}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        schedules={schedules}
        onClose={() => setIsPrintModalOpen(false)}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#2d3133] text-[#eff1f3] px-4 py-2.5 rounded-full shadow-xl text-[12px] font-semibold flex items-center gap-2 animate-bounceIn border border-white/10">
          <span className="material-symbols-outlined text-[#6ffbbe] text-[18px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
