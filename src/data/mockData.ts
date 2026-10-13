import { UserProfile, StudentAttendance, ClassAttendanceSummary, TeacherCallAlert } from '../types';

export const SCHOOL_LOGO = '/logo-smk.png';

export const USER_PROFILES: Record<string, UserProfile> = {
  sekretaris: {
    id: 'user-farhan',
    name: 'Muhammad Farhan',
    role: 'sekretaris',
    roleTitle: 'Sekretaris Kelas • XI RPL 1',
    identifier: '0057182901',
    classRoom: 'XI RPL 1',
    homeroomTeacher: 'Ibu Dra. Hartini',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYnt2a-k9qr2VrGiR_aaNyxA0kr0zTUoyDij-XJB6qo6dMjg8FwbnhLqNO9exCCHBmngm533nSRqYmZP6JCfHuekrOs7MIEzSxrxLB3Y9p7b6kz_vmOcu2eVdHJ6K2OBzJzjnQsNXJJ0L4yaOC2pFWOq5kT9LmUjuf-Ic0KY7KPRI5lxlTQxwOck9ly6Z0aUijW0_dwOqKrQ8upujFgHbM-wse0kY5Sq_d0DVyjWeOjp5SyzN_Htoh',
    nipOrNisnLabel: 'NISN Siswa',
    isAtSchool: true,
    attendanceRate: 0,
    streakDays: 0,
  },
  siswa: {
    id: 'user-siswa',
    name: 'Siti Aminah',
    role: 'siswa',
    roleTitle: 'Siswa • XI RPL 1',
    identifier: '0058291042',
    classRoom: 'XI RPL 1',
    homeroomTeacher: 'Ibu Dra. Hartini',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ATs24ewyqE0mhqdjvOhidGqazm6XbMOZqLh9sxXUkf7ISKL4MdTBMlnpgMmsFBSLh0J2yaVuSi9j2P4KMoG5ENBLJ6BxxwdUqYLjnIMpTGfDjF_qkJPrxLEtKugoAHsTvrDCoKADfBRR3zR4KCWxDA7O5bBmp1gsN8eC8OfDXxAlG1V-r63VAH8qn2UNm3lmGNx4BzNdS71bWPweBcczZt-gOjQCPCZo24bqMCjQaDW49tuGWDwz',
    nipOrNisnLabel: 'NISN Siswa',
    isAtSchool: true,
    attendanceRate: 0,
    streakDays: 0,
  },
  guru: {
    id: 'user-budi',
    name: 'Budi Santoso, S.Kom.',
    role: 'guru',
    roleTitle: 'Guru Produktif RPL',
    identifier: '19850314 201001 1 008',
    classRoom: 'XII TKJ 1',
    kelas_id: 'e88128be-8fc3-4973-8d69-00ef17571626',
    kelas: { id: 'e88128be-8fc3-4973-8d69-00ef17571626', nama: 'XII TKJ 1' },
    homeroomTeacher: '-',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBsjqqNUms7en4dEsFynEe-Ynj70m9IRBQFAt4kd0q0EC86X5bcowEuKK7P8ESzZQ1GnZPacrA3xHhBPbyzvPgqXjtQzmUdbHn5A7iE7Obpm-e1QLGdAx5Fk04s125mVdFFPsqg4ka06-5JLRBZyHIjrxP65z71ILzB2zNoP6IS7AlEXCqB9WSOVtmqXTEZnVAJ_PElhjC9ooSUx9lDAf0vqxN8gwIyRKMT7mD_nWG0YUat6Ke_v5Cn',
    nipOrNisnLabel: 'NIP Guru',
    isAtSchool: true,
    attendanceRate: 0,
    streakDays: 0,
  },
  operator: {
    id: 'user-admin',
    name: 'Admin Kurikulum & Dapodik',
    role: 'operator',
    roleTitle: 'Administrator Utama SMKN 1',
    identifier: 'admin.kurikulum',
    classRoom: 'Pusat Kontrol Sekolah',
    homeroomTeacher: '-',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida/AEtjO1W9rn4mcj87694X5B7-tJf8vbX-pFRuzXwmhdsD5w4Qze3r9vtvq6sodoyDWrU8inQpDWXYhQGVEfyxGOGWGgeod-ls4ZaYU-EijnOzzhiSoCKbd7GFi_C9zrRyBN1I0Nupm6o-oWwc1yAVFvfvtmWNNmEc87K-Bxa6bgul49AqIfXlG8byA0IaWSOFsdDNYPMPqhvYvtklYA-uNaseHw0YkMpiyIlZD_q7ofJ3VIZr3AFQpgsDRHQGkSw',
    nipOrNisnLabel: 'ID Operator',
    isAtSchool: true,
    attendanceRate: 0,
    streakDays: 0,
  },
};

export const INITIAL_CLASS_SUMMARY: ClassAttendanceSummary = {
  className: 'XI RPL 1',
  totalStudents: 34,
  present: 0,
  sick: 0,
  permitted: 0,
  unexcused: 0,
  validationStatus: 'draft',
};

export const INITIAL_STUDENTS: StudentAttendance[] = [
  {
    id: 'std-1',
    name: 'Muhammad Farhan',
    studentNo: '01',
    nisn: '0057182901',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAAoF0IwBG0rnnwwhQJI4Xm2x8B91tc_cBA0Cb2mxe_u193s80e7uKrMkJKxf-gjrVC5G_jY6hit5Sf8ijZPBrzMeyDTanVEZXWfWncEtI3V9dueUPu7PlCQW-FALpimlpMQ1dqMLFJbiLZj_FQ0wm66TKplPkIjSfuOkh45tOE8SX9EJOFn75io4Mlgy5gnyDfoIyHvXF2fHmnZN7f466f1ZtXNiUhXislLBlrNTsL3tnkyBaw3Qp5',
    morningStatus: 'hadir',
    morningCheckInTime: '06:45 WIT',
    subjectStatus: 'hadir',
  },
  {
    id: 'std-2',
    name: 'Kevin Pratama',
    studentNo: '02',
    nisn: '0058291043',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuANGP7Qqs7Gjw1CHcqTcVhs3PlExZDDCzgVlCZRfOVdQ_DutWS6YziETQdAvETSTySizRn97ULIu3HKrmeI5RjOdH7AlkmyII-f4ziAsn4w9ILX-dOk1Lrb7oE8skkO01gWDPL3IhxCmBAz_tcECX09yqDMVY5YyXHEl2ciK4thc3a0VBdN2-y7M6yv7ZCJNEy6aGabeS9Ga2jUjkBEH3hU_M58gIHrmvwxM1rR8hHnIVcLnRyRB5a8',
    morningStatus: 'hadir',
    subjectStatus: 'hadir',
  },
  {
    id: 'std-3',
    name: 'Siti Aminah',
    studentNo: '03',
    nisn: '0058291042',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ATs24ewyqE0mhqdjvOhidGqazm6XbMOZqLh9sxXUkf7ISKL4MdTBMlnpgMmsFBSLh0J2yaVuSi9j2P4KMoG5ENBLJ6BxxwdUqYLjnIMpTGfDjF_qkJPrxLEtKugoAHsTvrDCoKADfBRR3zR4KCWxDA7O5bBmp1gsN8eC8OfDXxAlG1V-r63VAH8qn2UNm3lmGNx4BzNdS71bWPweBcczZt-gOjQCPCZo24bqMCjQaDW49tuGWDwz',
    morningStatus: 'hadir',
    subjectStatus: 'hadir',
  },
  {
    id: 'std-4',
    name: 'Doni Tata',
    studentNo: '04',
    nisn: '0058291055',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYtVadvsmDFMwbnpURLpogQCUfl4E1MBROuSv_GucxKYxpmGJy2I0sjbmxVSLqER3V_3CnMfKeRcFGq109tS8rhMfPYYFDTaTpZ0yhjbkd9P5xnI-WTCwh9E99mWrZb5-DA2i9ETZ7iPrxl9PnIOSZDdjNMsiqoUx7s9FgQUnl_-zq9pBaCYQGEeMd_ZkH-Tciho5Y3ls9uhxRghP5DrEN2CAWlhXYU0RRFAVrjOqNB3NeWQhmuh4D',
    morningStatus: 'hadir',
    subjectStatus: 'hadir',
  },
  {
    id: 'std-5',
    name: 'Ahmad Dani',
    studentNo: '08',
    nisn: '0058291008',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYnt2a-k9qr2VrGiR_aaNyxA0kr0zTUoyDij-XJB6qo6dMjg8FwbnhLqNO9exCCHBmngm533nSRqYmZP6JCfHuekrOs7MIEzSxrxLB3Y9p7b6kz_vmOcu2eVdHJ6K2OBzJzjnQsNXJJ0L4yaOC2pFWOq5kT9LmUjuf-Ic0KY7KPRI5lxlTQxwOck9ly6Z0aUijW0_dwOqKrQ8upujFgHbM-wse0kY5Sq_d0DVyjWeOjp5SyzN_Htoh',
    morningStatus: 'hadir',
    subjectStatus: 'hadir',
  },
  {
    id: 'std-6',
    name: 'Cindy Laura',
    studentNo: '14',
    nisn: '0058291014',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ATs24ewyqE0mhqdjvOhidGqazm6XbMOZqLh9sxXUkf7ISKL4MdTBMlnpgMmsFBSLh0J2yaVuSi9j2P4KMoG5ENBLJ6BxxwdUqYLjnIMpTGfDjF_qkJPrxLEtKugoAHsTvrDCoKADfBRR3zR4KCWxDA7O5bBmp1gsN8eC8OfDXxAlG1V-r63VAH8qn2UNm3lmGNx4BzNdS71bWPweBcczZt-gOjQCPCZo24bqMCjQaDW49tuGWDwz',
    morningStatus: 'hadir',
    subjectStatus: 'hadir',
  },
  {
    id: 'std-7',
    name: 'Rina Melinda',
    studentNo: '23',
    nisn: '0058291023',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB6ATs24ewyqE0mhqdjvOhidGqazm6XbMOZqLh9sxXUkf7ISKL4MdTBMlnpgMmsFBSLh0J2yaVuSi9j2P4KMoG5ENBLJ6BxxwdUqYLjnIMpTGfDjF_qkJPrxLEtKugoAHsTvrDCoKADfBRR3zR4KCWxDA7O5bBmp1gsN8eC8OfDXxAlG1V-r63VAH8qn2UNm3lmGNx4BzNdS71bWPweBcczZt-gOjQCPCZo24bqMCjQaDW49tuGWDwz',
    morningStatus: 'hadir',
    subjectStatus: 'hadir',
  },
];

export const INITIAL_TEACHER_ALERT: TeacherCallAlert = {
  id: 'alert-budi-rpl1',
  className: 'XI RPL 1',
  subject: 'Pemrograman Web Lanjut',
  room: 'Lab Komputer RPL 2',
  timestamp: '08.50 WIT',
  message: 'Pak Budi Santoso, S.Kom. belum memindai check-in di Lab RPL 2. Sekretaris dapat mengirim sinyal kesiapan kelas.',
  teacherName: 'Budi Santoso, S.Kom.',
  isActive: true,
  statusResponse: 'pending',
};
