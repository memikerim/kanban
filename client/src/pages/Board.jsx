/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { io } from 'socket.io-client'; // YENİ: Socket.io istemcisi
import TourModal from '../components/TourModal';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

// YENİ: Sunucu ile socket bağlantısını kur
// React state değiştiğinde bağlantının kopmaması için dışarıda tanımlamak iyidir.
const socket = io('https://kanban-t778.onrender.com', {
  autoConnect: false // Sadece bileşen yüklendiğinde bağlayacağız
});

export default function Board() {
  const { theme, isDark } = useTheme();
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [columns, setColumns] = useState([]);
  const [newTaskText, setNewTaskText] = useState({});
  const [editingTask, setEditingTask] = useState(null); 

  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  const [toastMessage, setToastMessage] = useState(null); 
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', id: null, columnId: null });

  const [usersList, setUsersList] = useState([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);

  // Uygulama açıldığında eğer "Tekrar gösterme" seçilmemişse gezi turunu otomatik aç
  useEffect(() => {
    const isTourHidden = localStorage.getItem('hide_onboarding_tour') === 'true';
    if (!isTourHidden) {
      setShowTourModal(true);
    }
  }, []);

  // --- Workspace State ---
  const [workspaces, setWorkspaces] = useState([]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState('create'); // 'create' veya 'join'
  const [newWsName, setNewWsName] = useState('');
  const [newWsPassword, setNewWsPassword] = useState('');
  const [joinWsId, setJoinWsId] = useState('');
  const [joinWsPassword, setJoinWsPassword] = useState('');
  const [showWsMembersModal, setShowWsMembersModal] = useState(false);
  const [wsModalId, setWsModalId] = useState(null); // Üyeler/Ayarlar modalında açık olan alan
  const [wsRenameInput, setWsRenameInput] = useState('');
  const [wsNewPassword, setWsNewPassword] = useState('');
  const [wsNewPasswordConfirm, setWsNewPasswordConfirm] = useState('');
  const [wsLeaveWarning, setWsLeaveWarning] = useState('');

  // --- Son Değişiklikler (Proje / Alan) ---
  const [logsTab, setLogsTab] = useState('project'); // 'project' veya 'workspace'
  const [workspaceLogs, setWorkspaceLogs] = useState([]);
  const [logsWorkspaceId, setLogsWorkspaceId] = useState(null);

  // --- Account Modal State ---
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
    const [deleteAccountError, setDeleteAccountError] = useState('');

  // --- Password Change State ---
  const [changePasswordOld, setChangePasswordOld] = useState('');
  const [changePasswordNew, setChangePasswordNew] = useState('');
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('');
  const [changePasswordCaptchaCode, setChangePasswordCaptchaCode] = useState('');
  const [changePasswordCaptchaInput, setChangePasswordCaptchaInput] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  useEffect(() => {
    if (showAccountModal) {
      setChangePasswordCaptchaCode(Math.floor(100000 + Math.random() * 900000).toString());
      setChangePasswordCaptchaInput('');
      setChangePasswordOld('');
      setChangePasswordNew('');
      setChangePasswordConfirm('');
      setChangePasswordError('');
      setChangePasswordSuccess('');
    }
  }, [showAccountModal]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (changePasswordCaptchaInput !== changePasswordCaptchaCode) {
      return setChangePasswordError("Robot kontrol kodu hatalı. Lütfen tekrar deneyin.");
    }
    if (changePasswordNew !== changePasswordConfirm) {
      return setChangePasswordError("Şifreler eşleşmiyor! Lütfen kontrol edin.");
    }
    if (changePasswordNew.length < 6) {
      return setChangePasswordError("Yeni şifre en az 6 karakter olmalıdır.");
    }

    try {
      const res = await api.put('/auth/change-password', {
        oldPassword: changePasswordOld,
        newPassword: changePasswordNew
      });
      setChangePasswordSuccess(res.data.message || "Şifreniz başarıyla değiştirildi.");
      setChangePasswordOld('');
      setChangePasswordNew('');
      setChangePasswordConfirm('');
      setChangePasswordCaptchaCode(Math.floor(100000 + Math.random() * 900000).toString());
      setChangePasswordCaptchaInput('');
    } catch (err) {
      setChangePasswordError(err.response?.data?.error || "Şifre değiştirilemedi.");
    }
  };

  const handleDeleteMyAccount = async (e) => {
    e.preventDefault();
    setDeleteAccountError('');
    if (!deleteAccountPassword) {
      setDeleteAccountError('Lütfen onaylamak için şifrenizi girin.');
      return;
    }
    if (!window.confirm("Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!")) return;
    try {
      await api.post('/auth/delete-account', { password: deleteAccountPassword });
      setShowAccountModal(false);
      localStorage.removeItem('token'); 
      localStorage.removeItem('auth-storage'); 
      localStorage.removeItem('remember_me');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('auth-storage');
      sessionStorage.removeItem('remember_me');
      delete api.defaults.headers.common['Authorization'];
      logout();
      navigate('/login');
    } catch (error) {
      setDeleteAccountError(error.response?.data?.error || 'Hesap silinemedi.');
    }
  };

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const navigate = useNavigate();

  // Sayfa yüklendiğinde kullanıcı bilgisi yoksa sunucudan çek
  useEffect(() => {
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

  const getRoleDisplayName = (role) => {
    if (!role) return 'KULLANICI';
    const r = role.toLowerCase();
    if (r === 'owner') return 'SİSTEM YÖNETİCİSİ';
    if (r === 'admin') return 'ADMİN';
    return 'KULLANICI';
  };

  const currentUser = {
    name: user?.name || 'Kullanıcı',
    role: getRoleDisplayName(user?.role),
    rawRole: user?.role ? user.role.toLowerCase() : 'user'
  };

  const showToast = (message, type = 'error') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000); 
  };

  const fetchBoardData = async () => {
    if (!currentProjectId) return;
    try {
      const response = await api.get(`/projects/${currentProjectId}/board`);
      setColumns(response.data);
    } catch (error) {
      console.error('Pano verileri yüklenemedi:', error);
    }
  };

  useEffect(() => {
    const getInitialProjects = async () => {
      try {
        const response = await api.get('/projects');
        setProjects(response.data);
      } catch (error) {
        console.error('Projeler yüklenemedi:', error);
      }
    };
    getInitialProjects();
  }, []);

  useEffect(() => {
    fetchBoardData();

    // YENİ: Socket.io odasına katılma ve board_updated dinleme
    if (currentProjectId) {
      if (!socket.connected) {
        socket.connect();
      }
      
      socket.emit('join_project', currentProjectId);

      const handleBoardUpdated = () => {
        // Başka biri görev güncellediğinde sadece veriyi yeniden çekiyoruz (sayfa yenilenmez, sadece DOM güncellenir)
        fetchBoardData();
      };

      socket.on('board_updated', handleBoardUpdated);

      return () => {
        socket.off('board_updated', handleBoardUpdated);
      };
    }
  }, [currentProjectId]);

  // YENİ: Workspace anlık güncellemeleri dinleme (Proje ekleme/silme, alan adı/şifre/yetki/üyelik değişiklikleri)
  useEffect(() => {
    const handleWorkspaceUpdated = async (payload) => {
      try {
        const wsResponse = await api.get('/workspaces');
        if (Array.isArray(wsResponse.data)) {
          setWorkspaces(wsResponse.data);
          
          if (currentWorkspaceId) {
            const updatedWs = wsResponse.data.find(w => w.id === currentWorkspaceId);
            if (updatedWs) {
              setProjects(updatedWs.projects || []);
              if (currentProjectId && !updatedWs.projects?.some(p => p.id === currentProjectId)) {
                setCurrentProjectId(null);
                setColumns([]);
              }
            } else {
              // Kullanıcı alandan çıkarıldıysa veya alan silindiyse kişisel projelere dön
              setCurrentWorkspaceId(null);
              setCurrentProjectId(null);
              setColumns([]);
              try {
                const response = await api.get('/projects');
                setProjects(response.data);
              } catch (e) {}
              showToast("Artık bu çalışma alanının üyesi değilsiniz.", "error");
            }
          }

          // Üyeler/Ayarlar modalı açıksa ve alana erişim kalmadıysa modalı kapat
          if (wsModalId && !wsResponse.data.some(w => w.id === wsModalId)) {
            setShowWsMembersModal(false);
            setWsModalId(null);
          }
        }

        // Alan son değişiklikleri açıksa anlık yenile
        const changedWsId = payload?.workspaceId;
        if (showLogs && logsWorkspaceId && (!changedWsId || changedWsId === logsWorkspaceId)) {
          try {
            const logsResponse = await api.get(`/workspaces/${logsWorkspaceId}/logs`);
            setWorkspaceLogs(logsResponse.data);
          } catch (e) {}
        }
      } catch (error) {
        console.error("Workspace güncellenirken hata:", error);
      }
    };

    socket.on('workspace_updated', handleWorkspaceUpdated);

    return () => {
      socket.off('workspace_updated', handleWorkspaceUpdated);
    };
  }, [currentWorkspaceId, currentProjectId, wsModalId, showLogs, logsWorkspaceId]);

  useEffect(() => {
    if (workspaces.length > 0) {
      if (!socket.connected) socket.connect();
      workspaces.forEach(ws => socket.emit('join_workspace', ws.id));
    }
  }, [workspaces.map(w => w.id).join(',')]);

  // Workspace'leri çek
  const fetchWorkspaces = async () => {
    try {
      const response = await api.get('/workspaces');
      if (Array.isArray(response.data)) setWorkspaces(response.data);
    } catch (error) {
      console.error('Workspace\'ler yüklenemedi:', error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Yeni workspace oluştur
  const handleCreateWorkspace = async () => {
    if (!newWsName || !newWsName.trim()) {
      return showToast("Lütfen bir çalışma alanı adı girin.", "error");
    }
    if (!newWsPassword || !newWsPassword.trim()) {
      return showToast("Lütfen çalışma alanı için bir şifre girin.", "error");
    }
    try {
      await api.post('/workspaces', { name: newWsName.trim(), password: newWsPassword });
      showToast("Çalışma alanı oluşturuldu!", "success");
      setNewWsName(''); setNewWsPassword('');
      setShowWorkspaceModal(false);
      await fetchWorkspaces();
    } catch (error) {
      showToast(error.response?.data?.error || "Oluşturulamadı.", "error");
    }
  };

  // Workspace'e katıl
  const handleJoinWorkspace = async () => {
    if (!joinWsId || !joinWsPassword) return showToast("Davet kodu ve şifre gereklidir.", "error");
    try {
      const response = await api.post('/workspaces/join', { inviteCode: joinWsId, password: joinWsPassword });
      showToast(response.data.message, "success");
      setJoinWsId(''); setJoinWsPassword('');
      setShowWorkspaceModal(false);
      await fetchWorkspaces();
    } catch (error) {
      showToast(error.response?.data?.error || "Katılınamadı.", "error");
    }
  };

  // Workspace seç → projeleri filtrele
  const handleSelectWorkspace = (ws) => {
    setCurrentWorkspaceId(ws.id);
    setProjects(ws.projects || []);
    setCurrentProjectId(null);
    setColumns([]);
  };

  // Kişisel projelere dön
  const handleBackToPersonal = async () => {
    setCurrentWorkspaceId(null);
    setCurrentProjectId(null);
    setColumns([]);
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Projeler yüklenemedi:', error);
    }
  };

  // Workspace üyelerini / ayarlarını göster
  const handleShowWsMembers = (ws) => {
    setWsModalId(ws.id);
    setWsRenameInput(ws.name || '');
    setWsNewPassword('');
    setWsNewPasswordConfirm('');
    setWsLeaveWarning('');
    setShowWsMembersModal(true);
  };

  // Modalda açık olan alan (workspaces state'inden türetilir → socket ile anlık güncellenir)
  const wsModal = workspaces.find(w => w.id === wsModalId) || null;
  const wsModalMembers = wsModal?.members || [];
  const wsModalIsAdmin = wsModal?.myRole === 'ADMIN';
  const wsModalAdminCount = wsModalMembers.filter(m => m.role === 'ADMIN').length;

  // Workspace'ten üye çıkar
  const handleKickMember = async (targetUserId) => {
    if (!wsModalId) return;
    if (!window.confirm("Bu üyeyi çalışma alanından çıkarmak istediğinize emin misiniz?")) return;
    try {
      await api.post('/workspaces/kick', { workspaceId: wsModalId, targetUserId });
      showToast("Üye çıkarıldı.", "success");
      await fetchWorkspaces();
    } catch (error) {
      showToast(error.response?.data?.error || "Üye çıkarılamadı.", "error");
    }
  };

  // Üye yetkisini değiştir (Admin yap / Adminliği al)
  const handleChangeMemberRole = async (targetUserId, role) => {
    if (!wsModalId) return;
    const isSelf = targetUserId === user?.id;
    if (role === 'MEMBER' && wsModalAdminCount <= 1) {
      const msg = "Alanda en az bir admin bulunmalıdır. Önce başka bir üyeyi admin olarak atayın.";
      setWsLeaveWarning(msg);
      return showToast(msg, "error");
    }
    const confirmText = role === 'ADMIN'
      ? "Bu üyeyi admin yapmak istediğinize emin misiniz? Admin olan üye alan adını, şifresini ve yetkileri yönetebilir."
      : (isSelf ? "Kendi adminlik yetkinizi bırakmak istediğinize emin misiniz?" : "Bu üyenin adminlik yetkisini kaldırmak istediğinize emin misiniz?");
    if (!window.confirm(confirmText)) return;
    try {
      await api.put(`/workspaces/${wsModalId}/role`, { targetUserId, role });
      setWsLeaveWarning('');
      showToast(role === 'ADMIN' ? "Üye admin olarak atandı." : "Adminlik yetkisi kaldırıldı.", "success");
      await fetchWorkspaces();
    } catch (error) {
      showToast(error.response?.data?.error || "Yetki değiştirilemedi.", "error");
    }
  };

  // Alan adını değiştir (sadece admin)
  const handleRenameWorkspace = async () => {
    if (!wsModalId) return;
    if (!wsRenameInput || !wsRenameInput.trim()) {
      return showToast("Lütfen yeni bir çalışma alanı adı girin.", "error");
    }
    if (wsRenameInput.trim() === wsModal?.name) {
      return showToast("Yeni alan adı mevcut adla aynı.", "error");
    }
    try {
      await api.put(`/workspaces/${wsModalId}/name`, { name: wsRenameInput.trim() });
      showToast("Alan adı güncellendi. Tüm üyeler bilgilendirildi.", "success");
      await fetchWorkspaces();
    } catch (error) {
      showToast(error.response?.data?.error || "Alan adı değiştirilemedi.", "error");
    }
  };

  // Alan şifresini değiştir (sadece admin)
  const handleChangeWorkspacePassword = async () => {
    if (!wsModalId) return;
    if (!wsNewPassword || !wsNewPassword.trim()) {
      return showToast("Lütfen yeni alan şifresini girin.", "error");
    }
    if (wsNewPassword.length < 4) {
      return showToast("Alan şifresi en az 4 karakter olmalıdır.", "error");
    }
    if (wsNewPassword !== wsNewPasswordConfirm) {
      return showToast("Yeni şifreler eşleşmiyor!", "error");
    }
    try {
      await api.put(`/workspaces/${wsModalId}/password`, { newPassword: wsNewPassword });
      setWsNewPassword('');
      setWsNewPasswordConfirm('');
      showToast("Alan şifresi güncellendi. Tüm üyeler bilgilendirildi.", "success");
    } catch (error) {
      showToast(error.response?.data?.error || "Alan şifresi değiştirilemedi.", "error");
    }
  };

  // Alandan ayrıl
  const handleLeaveWorkspace = async () => {
    if (!wsModal) return;
    const isLastMember = wsModalMembers.length <= 1;

    // Tek admin ayrılmak istiyorsa önce yeni admin ataması gerekir
    if (!isLastMember && wsModalIsAdmin && wsModalAdminCount <= 1) {
      const msg = "Alandaki tek admin sizsiniz. Ayrılmadan önce aşağıdaki listeden başka bir üyeyi \"Admin Yap\" butonuyla admin olarak atamalısınız.";
      setWsLeaveWarning(msg);
      return showToast("Ayrılmadan önce yeni bir admin atamalısınız.", "error");
    }

    const confirmText = isLastMember
      ? "Bu alandaki son üyesiniz. Ayrılırsanız çalışma alanı ve içindeki tüm projeler kalıcı olarak silinecek. Devam etmek istiyor musunuz?"
      : `"${wsModal.name}" çalışma alanından ayrılmak istediğinize emin misiniz?`;
    if (!window.confirm(confirmText)) return;

    try {
      const leavingId = wsModal.id;
      const response = await api.post(`/workspaces/${leavingId}/leave`);
      setShowWsMembersModal(false);
      setWsModalId(null);
      if (currentWorkspaceId === leavingId) {
        await handleBackToPersonal();
      }
      await fetchWorkspaces();
      showToast(response.data?.message || "Çalışma alanından ayrıldınız.", "success");
    } catch (error) {
      if (error.response?.data?.code === 'LAST_ADMIN') setWsLeaveWarning(error.response.data.error);
      showToast(error.response?.data?.error || "Alandan ayrılınamadı.", "error");
    }
  };

  // Alanın son değişikliklerini getir
  const fetchWorkspaceLogs = async (wsId) => {
    try {
      const response = await api.get(`/workspaces/${wsId}/logs`);
      setWorkspaceLogs(response.data);
    } catch (error) {
      setWorkspaceLogs([]);
      console.error("Alan logları çekilemedi", error);
    }
  };

  // Sol menüden doğrudan bir alanın son değişikliklerini aç (mobil dahil)
  const handleOpenWorkspaceLogs = async (wsId) => {
    setLogsWorkspaceId(wsId);
    setLogsTab('workspace');
    await fetchWorkspaceLogs(wsId);
    setShowLogs(true);
  };

  // Workspace'e proje ekle
  const handleAddWsProject = async () => {
    if (!newProjectName || !newProjectName.trim()) {
      return showToast("Lütfen bir proje adı girin.", "error");
    }
    if (!currentWorkspaceId) return;
    try {
      const response = await api.post('/workspaces/project', { workspaceId: currentWorkspaceId, name: newProjectName.trim() });
      setNewProjectName('');
      // Yeni projeyi mevcut listeye ekle (gereksiz API çağrısı yapmadan)
      const newProject = response.data;
      setProjects(prev => [...prev, newProject]);
      // Workspace listesini de güncelle
      await fetchWorkspaces();
      showToast("Proje başarıyla eklendi!", "success");
    } catch (error) {
      showToast(error.response?.data?.error || "Proje eklenemedi.", "error");
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName || !newProjectName.trim()) {
      return showToast("Lütfen bir proje adı girin.", "error");
    }
    try {
      await api.post('/projects', { name: newProjectName.trim() });
      setNewProjectName('');
      const response = await api.get('/projects');
      setProjects(response.data);
      showToast("Proje başarıyla eklendi!", "success");
    } catch (error) {
      showToast(error.response?.data?.error || "Proje eklenemedi.", "error");
    }
  };

  const triggerDeleteProject = (id, e) => {
    e.stopPropagation();
    setConfirmDialog({ isOpen: true, type: 'project', id, columnId: null });
  };

  const triggerDeleteTask = (columnId, taskId, e) => {
    e.stopPropagation();
    setConfirmDialog({ isOpen: true, type: 'task', id: taskId, columnId });
  };

  const executeDelete = async () => {
    if (confirmDialog.type === 'project') {
      try {
        await api.delete(`/projects/${confirmDialog.id}`);
        if (currentProjectId === confirmDialog.id) {
          setCurrentProjectId(null);
          setColumns([]);
        }

        if (currentWorkspaceId) {
          // Çalışma alanı (Workspace) içerisindeyken alan projeleri listesini koru ve güncelle
          setProjects(prev => prev.filter(p => p.id !== confirmDialog.id));
          const wsResponse = await api.get('/workspaces');
          if (Array.isArray(wsResponse.data)) {
            setWorkspaces(wsResponse.data);
            const currentWs = wsResponse.data.find(w => w.id === currentWorkspaceId);
            if (currentWs) {
              setProjects(currentWs.projects || []);
            }
          }
        } else {
          // Kişisel projelerdeyken kişisel projeler listesini güncelle
          setProjects(prev => prev.filter(p => p.id !== confirmDialog.id));
          const response = await api.get('/projects');
          setProjects(response.data);
        }

        showToast("Proje başarıyla silindi.", "success");
      } catch (error) {
        if (error.response && error.response.status === 403) {
          showToast(error.response.data.error || "Yetkiniz yok!", "error");
        } else {
          showToast("Proje silinirken beklenmeyen bir hata oluştu.", "error");
        }
      }
    } else if (confirmDialog.type === 'task') {
      try {
        await api.delete(`/tasks/${confirmDialog.id}`); 
        const newColumns = columns.map(col => {
          if (col.id === confirmDialog.columnId) {
            return { ...col, tasks: col.tasks.filter(task => task.id !== confirmDialog.id) };
          }
          return col;
        });
        setColumns(newColumns);
      } catch (error) {
        showToast("Görev silinemedi.", "error");
      }
    }
    setConfirmDialog({ isOpen: false, type: '', id: null, columnId: null });
  };

  const handleLogout = () => {
    try { logout(); } catch(e) {} 
    localStorage.removeItem('token'); 
    localStorage.removeItem('auth-storage'); 
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('auth-storage');
    sessionStorage.removeItem('remember_me');
    delete api.defaults.headers.common['Authorization'];
    navigate('/login'); 
  };

  const handleAddTask = async (columnId) => {
    const text = newTaskText[columnId];
    if (!text || text.trim() === '') {
      return showToast("Lütfen bir görev başlığı girin.", "error");
    }

    try {
      await api.post('/tasks', {
        title: text.trim(),
        columnId: parseInt(columnId),
        projectId: currentProjectId
      });

      setNewTaskText(prev => ({ ...prev, [columnId]: '' }));
      await fetchBoardData();
    } catch (error) {
      showToast(error.response?.data?.error || "Görev eklenemedi.", "error");
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    if (!editingTask.title || editingTask.title.trim() === '') {
      return showToast("Görev başlığı boş bırakılamaz.", "error");
    }
    try {
      await api.put(`/tasks/${editingTask.id}`, {
        title: editingTask.title.trim(),
        description: editingTask.description,
        color: editingTask.color,
        dueDate: editingTask.dueDate ? editingTask.dueDate : null 
      });

      setEditingTask(null);
      await fetchBoardData();
    } catch (error) {
      showToast("Görev güncellenemedi.", "error");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingTask) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      showToast('Dosya yükleniyor...', 'info');
      const res = await api.post(`/tasks/${editingTask.id}/attachments`, formData);
      
      setEditingTask(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), res.data]
      }));
      showToast('Dosya yüklendi!', 'success');
      await fetchBoardData();
    } catch (error) {
      showToast('Dosya yüklenemedi.', 'error');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!editingTask) return;
    try {
      await api.delete(`/tasks/${editingTask.id}/attachments/${attachmentId}`);
      setEditingTask(prev => ({
        ...prev,
        attachments: prev.attachments.filter(a => a.id !== attachmentId)
      }));
      showToast('Dosya silindi.', 'success');
      await fetchBoardData();
    } catch (error) {
      showToast('Dosya silinemedi.', 'error');
    }
  };

  // Masaüstü için tek tıkla sütun değiştirme fonksiyonu (Socket.io senkronizasyonlu)
  const handleMoveTaskDirect = async (taskId, targetColumnId, e) => {
    if (e) e.stopPropagation();

    const newColumns = Array.from(columns);
    let sourceColIndex = -1;
    let targetColIndex = -1;
    let taskToMove = null;

    for (let i = 0; i < newColumns.length; i++) {
      const taskIndex = newColumns[i].tasks?.findIndex(t => t.id === taskId);
      if (taskIndex !== undefined && taskIndex !== -1) {
        sourceColIndex = i;
        const tasks = Array.from(newColumns[i].tasks);
        [taskToMove] = tasks.splice(taskIndex, 1);
        newColumns[i] = { ...newColumns[i], tasks };
        break;
      }
    }

    targetColIndex = newColumns.findIndex(c => c.id === targetColumnId);
    if (!taskToMove || targetColIndex === -1 || sourceColIndex === targetColIndex) return;

    // Hedef sütuna ekle (en alta)
    const targetTasks = Array.from(newColumns[targetColIndex].tasks || []);
    targetTasks.push(taskToMove);
    newColumns[targetColIndex] = { ...newColumns[targetColIndex], tasks: targetTasks };

    // Optimistik güncelleme
    setColumns(newColumns);

    const updatedTasks = [];
    newColumns[targetColIndex].tasks.forEach((task, index) => {
      updatedTasks.push({ id: task.id, columnId: targetColumnId, order: index });
    });
    newColumns[sourceColIndex].tasks.forEach((task, index) => {
      updatedTasks.push({ id: task.id, columnId: newColumns[sourceColIndex].id, order: index });
    });

    try {
      await api.put('/tasks/reorder', { updatedTasks });
      await fetchBoardData();
    } catch (error) {
      console.error('Görev taşınırken hata oluştu:', error);
      await fetchBoardData();
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newColumns = Array.from(columns);
    
    const sourceColIndex = newColumns.findIndex(col => String(col.id) === source.droppableId);
    const destColIndex = newColumns.findIndex(col => String(col.id) === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceCol = newColumns[sourceColIndex];
    const destCol = newColumns[destColIndex];

    const sourceTasks = Array.from(sourceCol.tasks);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceTasks.splice(destination.index, 0, movedTask);
      newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
    } else {
      const destTasks = Array.from(destCol.tasks);
      destTasks.splice(destination.index, 0, movedTask);
      newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
      newColumns[destColIndex] = { ...destCol, tasks: destTasks };
    }
    
    setColumns(newColumns);

    const updatedTasks = [];
    newColumns[destColIndex].tasks.forEach((task, index) => {
      updatedTasks.push({ id: task.id, columnId: destCol.id, order: index });
    });

    if (source.droppableId !== destination.droppableId) {
      newColumns[sourceColIndex].tasks.forEach((task, index) => {
        updatedTasks.push({ id: task.id, columnId: sourceCol.id, order: index });
      });
    }

    try {
      await api.put('/tasks/reorder', { updatedTasks });
      await fetchBoardData();
    } catch (error) {
      console.error('Sıralama güncellenirken hata oluştu:', error);
      await fetchBoardData();
    }
  };

  const handleShowLogs = async () => {
    if (!currentProjectId && !currentWorkspaceId) return;
    try {
      if (currentProjectId) {
        const response = await api.get(`/projects/${currentProjectId}/logs`);
        setLogs(response.data);
      } else {
        setLogs([]);
      }
      if (currentWorkspaceId) {
        setLogsWorkspaceId(currentWorkspaceId);
        await fetchWorkspaceLogs(currentWorkspaceId);
      } else {
        setLogsWorkspaceId(null);
      }
      setLogsTab(currentProjectId ? 'project' : 'workspace');
      setShowLogs(true);
    } catch (error) {
      console.error("Loglar çekilemedi", error);
    }
  };

  const handleOpenUsersModal = async () => {
    try {
      const response = await api.get('/users');
      if (Array.isArray(response.data)) {
        setUsersList(response.data);
        setShowUsersModal(true);
      } else {
        throw new Error("Geçersiz veri formatı. Sunucu güncelleniyor olabilir, lütfen 1-2 dakika bekleyip tekrar deneyin.");
      }
    } catch (error) {
      showToast(error.response?.data?.error || error.message || "Kullanıcılar yüklenemedi", "error");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      showToast("Yetki başarıyla güncellendi.", "success");
      const response = await api.get('/users');
      if (Array.isArray(response.data)) setUsersList(response.data);
    } catch (error) {
      showToast(error.response?.data?.error || "Yetki güncellenemedi.", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bu kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz?")) return;
    try {
      await api.delete(`/users/${userId}`);
      showToast("Kullanıcı silindi.", "success");
      const response = await api.get('/users');
      if (Array.isArray(response.data)) setUsersList(response.data);
    } catch (error) {
      showToast(error.response?.data?.error || "Kullanıcı silinemedi.", "error");
    }
  };

  return (
    <div className="app-container" style={{ position: 'relative' }}>
      
      {toastMessage && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          backgroundColor: toastMessage.type === 'error' 
            ? (isDark ? '#450a0a' : '#ffebe6') 
            : (isDark ? '#064e3b' : '#e3fcef'),
          color: toastMessage.type === 'error' 
            ? (isDark ? '#fca5a5' : '#bf2600') 
            : (isDark ? '#6ee7b7' : '#006644'),
          border: `1px solid ${toastMessage.type === 'error' 
            ? (isDark ? '#7f1d1d' : '#ffbdad') 
            : (isDark ? '#065f46' : '#abf5d1')}`,
          padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', 
          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.6)' : '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '90%', textAlign: 'center', fontSize: '13.5px'
        }}>
          {toastMessage.message}
        </div>
      )}

      {confirmDialog.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2000,
          backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ background: isDark ? '#1e293b' : 'white', border: isDark ? '1px solid #334155' : 'none', padding: '25px', borderRadius: '8px', width: '350px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: isDark ? '#f8fafc' : '#172b4d' }}>Emin misiniz?</h3>
            <p style={{ color: isDark ? '#94a3b8' : '#5e6c84', marginBottom: '25px' }}>
              Bu {confirmDialog.type === 'project' ? 'projeyi' : 'görevi'} silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <button 
                onClick={() => setConfirmDialog({ isOpen: false, type: '', id: null, columnId: null })}
                style={{ flex: 1, padding: '10px', background: isDark ? '#334155' : '#e4f0f6', color: isDark ? '#f8fafc' : '#0079bf', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                İptal
              </button>
              <button 
                onClick={executeDelete}
                style={{ flex: 1, padding: '10px', background: '#ff5630', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`sidebar ${currentProjectId ? 'hidden-mobile' : ''}`}>
        {/* MOBİL İÇİN KULLANICI MENÜSÜ (Sadece mobilde en üstte görünür) */}
        <div className="mobile-user-menu" style={{ 
          marginBottom: '15px', 
          paddingBottom: '14px', 
          borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
          flexDirection: 'column', 
          gap: '12px' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '13px', lineHeight: '1.3' }}>
              Giriş: <strong>{currentUser.name}</strong>
              <div style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                Yetki: {currentUser.role}
              </div>
            </div>
            <ThemeToggle showLabel={false} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {currentUser.rawRole === 'owner' && (
              <button 
                onClick={handleOpenUsersModal} 
                style={{ padding: '7px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                👥 Kullanıcılar
              </button>
            )}
            <button 
              onClick={() => setShowTourModal(true)}
              style={{ padding: '7px 10px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              title="Uygulama Rehberi"
            >
              💡 Rehber
            </button>
            <button 
              onClick={() => { setShowAccountModal(true); setDeleteAccountError(''); setDeleteAccountPassword(''); }}
              style={{ padding: '7px 10px', background: '#4A5568', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ⚙️ Hesabım
            </button>
            <button 
              onClick={handleLogout} 
              style={{ padding: '7px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11.5px', flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Çıkış
            </button>
          </div>
        </div>

        {/* ÇALIŞMA ALANLARI */}
        <h3 style={{ fontSize: '14px', marginBottom: '5px' }}>🏢 Çalışma Alanları</h3>
        <ul className="sidebar-workspace-list">
          {workspaces.map((ws) => (
            <li 
              key={ws.id} 
              className={currentWorkspaceId === ws.id ? 'active' : ''}
              onClick={() => handleSelectWorkspace(ws)}
              style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', wordBreak: 'break-word', flex: 1, minWidth: 0 }}>{ws.name}</span>
                <small 
                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(ws.inviteCode); showToast("Davet kodu kopyalandı!", "success"); }}
                  title="Kopyalamak için tıklayın"
                  style={{ 
                    flexShrink: 0,
                    fontSize: '10px', color: isDark ? '#c4b5fd' : '#6c5ce7', background: isDark ? '#2e1065' : '#e8e6fb', 
                    padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace'
                  }}
                >
                  {ws.inviteCode} 📋
                </small>
              </div>
              <div style={{ display: 'flex', gap: '5px', marginTop: '2px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleShowWsMembers(ws); }}
                  title="Üyeler ve alan ayarları"
                  style={{ fontSize: '10px', padding: '3px 6px', background: isDark ? '#334155' : '#e4f0f6', color: isDark ? '#93c5fd' : '#0079bf', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                >
                  👥 Üyeler ({ws.members?.length || 0}){ws.myRole === 'ADMIN' ? ' · ⚙️' : ''}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenWorkspaceLogs(ws.id); }}
                  title="Alanın son değişiklikleri"
                  style={{ fontSize: '10px', padding: '3px 6px', background: isDark ? '#334155' : '#e4f0f6', color: isDark ? '#93c5fd' : '#0079bf', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                >
                  🕒 Geçmiş
                </button>
                <small style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#a5b1c2', alignSelf: 'center' }}>
                  {ws.myRole === 'ADMIN' ? '⭐ Admin' : '👤 Üye'}
                </small>
              </div>
            </li>
          ))}
        </ul>
        <button 
          onClick={() => setShowWorkspaceModal(true)}
          style={{ width: '100%', padding: '8px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', marginBottom: '15px' }}
        >
          + Yeni Alan / Alana Katıl
        </button>

        {/* PROJELER */}
        <hr style={{ border: 'none', borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0', margin: '6px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ fontSize: '14px', marginBottom: 0 }}>
            {currentWorkspaceId ? '📁 Alan Projeleri' : '📁 Projelerim'}
          </h3>
          {currentWorkspaceId && (
            <button 
              onClick={handleBackToPersonal}
              style={{ fontSize: '10px', padding: '3px 8px', background: '#fdcb6e', color: '#2d3436', border: 'none', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ← Kişisel
            </button>
          )}
        </div>
        <ul className="sidebar-project-list">
          {projects.map((project) => (
            <li 
              key={project.id} 
              className={currentProjectId === project.id ? 'active' : ''}
              onClick={() => setCurrentProjectId(project.id)}
              style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '8px' }}>
                <span style={{ fontWeight: '500', fontSize: '13.5px', wordBreak: 'break-word', flex: 1, minWidth: 0, lineHeight: '1.3' }}>
                  {project.name}
                </span>
                <button 
                  onClick={(e) => triggerDeleteProject(project.id, e)}
                  style={{ 
                    flexShrink: 0,
                    width: '22px',
                    height: '22px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.1)', 
                    border: 'none', 
                    color: '#ef4444', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    fontSize: '11px',
                    borderRadius: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ef4444';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  title="Projeyi Sil"
                >
                  ✕
                </button>
              </div>
              {project.user && (
                <small style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#a5b1c2' }}>
                  Oluşturan: {project.user.name}
                </small>
              )}
            </li>
          ))}
        </ul>
        <div className="new-project-box">
          <input 
            type="text" 
            placeholder="Yeni Proje Adı" 
            value={newProjectName} 
            onChange={(e) => setNewProjectName(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && (currentWorkspaceId ? handleAddWsProject() : handleAddProject())}
          />
          <button onClick={currentWorkspaceId ? handleAddWsProject : handleAddProject}>+ Proje Ekle</button>
        </div>
      </aside>

      <main className={`board ${!currentProjectId ? 'hide-main-on-mobile' : ''}`}>
        <header className="board-header">
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {currentProjectId && (
              <button 
                onClick={() => setCurrentProjectId(null)}
                className="back-btn-mobile"
                style={{ padding: '6px 12px', background: '#fdcb6e', color: '#2d3436', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                ⬅ Projelere Dön
              </button>
            )}
            <h2>{currentProjectId ? 'Proje Görevleri' : 'Kanban Panosu'}</h2>
            {(currentProjectId || currentWorkspaceId) && (
              <button 
                onClick={handleShowLogs}
                style={{ padding: '6px 12px', background: isDark ? '#334155' : '#e4f0f6', color: isDark ? '#93c5fd' : '#0079bf', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                🕒 Son Değişiklikler
              </button>
            )}
            <button 
              onClick={() => setShowTourModal(true)}
              className="mobile-guide-btn"
              style={{ padding: '6px 12px', background: isDark ? '#1e3a8a' : '#e4f0f6', color: isDark ? '#93c5fd' : '#0052cc', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              title="Uygulama Rehberi ve Tanıtım Turu"
            >
              💡 Rehber
            </button>
            <ThemeToggle className="mobile-theme-btn" showLabel={false} />
          </div>
          
          <div className="desktop-user-menu">
            <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
              <span style={{ display: 'block', fontSize: '14px', fontWeight: 'bold' }}>
                Giriş yapıldı: {currentUser.name}
              </span>
              <span style={{ display: 'block', fontSize: '12px', opacity: 0.8, textTransform: 'uppercase' }}>
                Yetki: {currentUser.role}
              </span>
            </div>
            {currentUser.rawRole === 'owner' && (
              <button 
                onClick={handleOpenUsersModal} 
                style={{ padding: '8px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                👥 Kullanıcı Yönetimi
              </button>
            )}
            <button 
              onClick={() => setShowTourModal(true)}
              style={{ padding: '8px 14px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              title="Uygulama Tanıtım Turu ve Özellik Rehberi"
            >
              💡 Uygulama Rehberi
            </button>
            <ThemeToggle />
            <button 
              onClick={() => { setShowAccountModal(true); setDeleteAccountError(''); setDeleteAccountPassword(''); }}
              style={{ padding: '8px 14px', background: '#4A5568', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ⚙️ Hesabım
            </button>
            <button onClick={handleLogout} className="logout-btn">Çıkış Yap</button>
          </div>
        </header>

        {currentProjectId ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="columns-container">
              
              {columns.map((column) => {
                const isDoneColumn = column.title?.toLowerCase().trim() === 'tamamlandı';
                return (
                <div key={column.id} className="column" style={{ background: isDark ? '#111827' : '#ebecf0', border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0' }}>
                  <h2 style={{ fontSize: '16px', margin: '0 0 10px 0', color: isDark ? '#f8fafc' : '#172b4d' }}>{column.title}</h2>
                  
                  <Droppable droppableId={String(column.id)}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="task-list"
                        style={{ minHeight: '150px' }} 
                      >
                        {column.tasks?.map((task, index) => (
                          <Draggable key={String(task.id)} draggableId={String(task.id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setEditingTask({ ...task, columnId: column.id })} 
                                style={{
                                  userSelect: 'none',
                                  padding: '12px',
                                  margin: '0 0 8px 0',
                                  backgroundColor: snapshot.isDragging 
                                    ? (isDark ? '#1e3a5f' : '#e6fcff') 
                                    : (isDoneColumn 
                                        ? (isDark ? '#151d2a' : '#f9fafb') 
                                        : (isDark ? '#1e293b' : '#fff')),
                                  borderRadius: '4px',
                                  boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.5)' : '0 1px 3px rgba(0,0,0,0.15)',
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                  cursor: 'pointer',
                                  borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                                  borderRight: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                                  borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                                  borderLeft: task.color 
                                    ? `6px solid ${task.color}` 
                                    : (isDoneColumn 
                                        ? '6px solid #36b37e' 
                                        : (isDark ? '1px solid #334155' : '1px solid #e2e8f0')), 
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', minWidth: 0, flex: 1 }}>
                                  <span style={{ 
                                    wordBreak: 'break-word', 
                                    paddingRight: '10px',
                                    textDecoration: isDoneColumn ? 'line-through' : 'none',
                                    color: isDoneColumn ? (isDark ? '#94a3b8' : '#5e6c84') : (isDark ? '#f8fafc' : '#172b4d'),
                                    opacity: isDoneColumn ? 0.8 : 1,
                                    fontWeight: isDoneColumn ? 'normal' : '500'
                                  }}>
                                    {task.title}
                                  </span>
                                  
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {task.dueDate && (
                                      <small style={{ color: isDark ? '#94a3b8' : '#5e6c84', fontSize: '11px' }}>
                                        📅 {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                                      </small>
                                    )}
                                    {task.description && (
                                      <small style={{ color: isDark ? '#94a3b8' : '#5e6c84', fontSize: '11px' }}>📝 Açıklama</small>
                                    )}
                                    {task.attachments && task.attachments.length > 0 && (
                                      <small style={{ color: isDark ? '#94a3b8' : '#5e6c84', fontSize: '11px' }}>📎 {task.attachments.length}</small>
                                    )}
                                  </div>
                                  
                                  {task.user && (
                                    <small style={{ color: isDark ? '#64748b' : '#888', fontSize: '10px', marginTop: '2px', fontStyle: 'italic' }}>
                                      Ekleyen: {task.user.name}
                                    </small>
                                  )}

                                  {/* Masaüstü Hızlı Taşıma Butonları (Mobilde CSS ile gizlenir) */}
                                  <div 
                                    className="task-quick-move-buttons" 
                                    style={{ 
                                      display: 'flex', 
                                      gap: '5px', 
                                      flexWrap: 'wrap', 
                                      marginTop: '8px', 
                                      paddingTop: '6px', 
                                      borderTop: isDark ? '1px dashed #334155' : '1px dashed #ebecf0' 
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {columns.filter(c => c.id !== column.id).map(targetCol => {
                                      const isTargetDone = targetCol.title?.toLowerCase().trim() === 'tamamlandı';
                                      const isTargetInProgress = targetCol.title?.toLowerCase().trim() === 'devam edenler';
                                      
                                      let btnBg = isDark ? '#334155' : '#f4f5f7';
                                      let btnColor = isDark ? '#cbd5e1' : '#42526e';
                                      let btnBorder = isDark ? '1px solid #475569' : '1px solid #dfe1e6';
                                      let icon = '➔';
                                      
                                      if (isTargetDone) {
                                        btnBg = isDark ? '#064e3b' : '#e3fcef';
                                        btnColor = isDark ? '#6ee7b7' : '#006644';
                                        btnBorder = isDark ? '1px solid #059669' : '1px solid #abf5d1';
                                        icon = '✔';
                                      } else if (isTargetInProgress) {
                                        btnBg = isDark ? '#1e3a8a' : '#deebff';
                                        btnColor = isDark ? '#93c5fd' : '#0747a6';
                                        btnBorder = isDark ? '1px solid #2563eb' : '1px solid #b3d4ff';
                                        icon = '⚡';
                                      } else {
                                        btnBg = isDark ? '#334155' : '#f4f5f7';
                                        btnColor = isDark ? '#cbd5e1' : '#42526e';
                                        btnBorder = isDark ? '1px solid #475569' : '1px solid #dfe1e6';
                                        icon = '⬅';
                                      }

                                      return (
                                        <button
                                          key={targetCol.id}
                                          onClick={(e) => handleMoveTaskDirect(task.id, targetCol.id, e)}
                                          title={`"${targetCol.title}" kısmına taşı`}
                                          style={{
                                            background: btnBg,
                                            color: btnColor,
                                            border: btnBorder,
                                            borderRadius: '4px',
                                            padding: '2px 7px',
                                            fontSize: '11px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            transition: 'all 0.15s ease'
                                          }}
                                        >
                                          <span>{icon}</span>
                                          <span>{targetCol.title}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                </div>
                                <button 
                                  onClick={(e) => triggerDeleteTask(column.id, task.id, e)}
                                  style={{ 
                                    flexShrink: 0,
                                    width: '20px',
                                    height: '20px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.1)', 
                                    border: 'none', 
                                    color: '#ef4444', 
                                    cursor: 'pointer', 
                                    fontWeight: 'bold',
                                    fontSize: '11px',
                                    borderRadius: '4px',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ef4444';
                                    e.currentTarget.style.color = '#ffffff';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.color = '#ef4444';
                                  }}
                                  title="Görevi Sil"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                    <input
                      type="text"
                      placeholder="Yeni görev ekle..."
                      value={newTaskText[column.id] || ''}
                      onChange={(e) => setNewTaskText({ ...newTaskText, [column.id]: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask(column.id)}
                      style={{ flex: 1, minWidth: 0, padding: '8px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #ccc', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f8fafc' : '#172b4d' }}
                    />
                    <button
                      onClick={() => handleAddTask(column.id)}
                      style={{ padding: '8px 12px', background: '#0079bf', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Ekle
                    </button>
                  </div>

                </div>
              );
            })}

            </div>
          </DragDropContext>
        ) : (
          <p style={{ color: isDark ? '#94a3b8' : '#5e6c84' }}>Lütfen görevleri görmek için sol menüden bir proje seçin.</p>
        )}
      </main>

      {/* GÖREV DETAY MODALI */}
      {editingTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#1e293b' : '#f4f5f7', border: isDark ? '1px solid #334155' : 'none', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <h3 style={{ margin: 0, color: isDark ? '#f8fafc' : '#172b4d' }}>Görev Detayı</h3>
            
            <input 
              type="text" 
              value={editingTask.title} 
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              style={{ padding: '10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6', background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#f8fafc' : '#172b4d', fontSize: '16px' }}
            />
            
            <textarea 
              placeholder="Daha detaylı bir açıklama ekle..."
              value={editingTask.description || ''}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              style={{ padding: '10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6', background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#f8fafc' : '#172b4d', minHeight: '100px', resize: 'vertical' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#5e6c84', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Etiket Rengi:
                <input 
                  type="color" 
                  value={editingTask.color || '#ffffff'} 
                  onChange={(e) => setEditingTask({ ...editingTask, color: e.target.value })}
                  style={{ cursor: 'pointer', border: 'none', width: '30px', height: '30px', padding: 0 }}
                />
              </label>

              <label style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#5e6c84', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Son Tarih:
                <input 
                  type="date" 
                  value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''} 
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  style={{ padding: '5px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6', background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#f8fafc' : '#172b4d' }}
                />
              </label>
            </div>

            {/* YENİ: DOSYA YÜKLEME VE EKLENTİLER */}
            <div style={{ borderTop: isDark ? '1px solid #334155' : '1px solid #dfe1e6', paddingTop: '10px', marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: isDark ? '#f8fafc' : '#172b4d' }}>📎 Eklentiler</h4>
                <label style={{ cursor: 'pointer', background: isDark ? '#334155' : '#e4f0f6', color: isDark ? '#93c5fd' : '#0079bf', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  Dosya Yükle
                  <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                </label>
              </div>

              {editingTask.attachments && editingTask.attachments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto', paddingRight: '5px' }}>
                  {editingTask.attachments.map(att => {
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(att.format?.toLowerCase());
                    return (
                      <div key={att.id} style={{ display: 'flex', gap: '12px', background: isDark ? '#0f172a' : '#fff', padding: '10px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6', alignItems: 'center' }}>
                        {isImage ? (
                          <div style={{ width: '80px', height: '60px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', backgroundColor: '#091e420f' }}>
                            <img src={att.url} alt="Önizleme" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: '80px', height: '60px', flexShrink: 0, borderRadius: '4px', backgroundColor: isDark ? '#334155' : '#e4f0f6', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px' }}>
                            📄
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: isDark ? '#f8fafc' : '#172b4d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {att.originalName || 'Dosya'}
                          </span>
                          <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#5e6c84' }}>
                            Eklenti • {att.format?.toUpperCase() || 'BİLİNMEYEN'}
                          </span>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                            <a href={isImage ? att.url : att.url.replace('/upload/', '/upload/fl_attachment/')} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: isDark ? '#60a5fa' : '#0052cc', textDecoration: 'underline', cursor: 'pointer' }}>
                              Aç / İndir
                            </a>
                            <button onClick={() => handleDeleteAttachment(att.id)} style={{ fontSize: '12px', color: '#ff5630', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                              Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#94a3b8' : '#5e6c84' }}>Henüz dosya eklenmemiş.</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={() => setEditingTask(null)}
                style={{ padding: '8px 16px', background: isDark ? '#334155' : '#e4f0f6', color: isDark ? '#f8fafc' : '#0079bf', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                İptal
              </button>
              <button 
                onClick={handleUpdateTask}
                style={{ padding: '8px 16px', background: '#0079bf', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SON DEĞİŞİKLİKLER (LOG) MODALI */}
      {showLogs && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#1e293b' : '#f4f5f7', border: isDark ? '1px solid #334155' : 'none', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: isDark ? '#f8fafc' : '#172b4d' }}>🕒 Son Değişiklikler</h3>
              <button onClick={() => { setShowLogs(false); setLogsWorkspaceId(null); }} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: isDark ? '#94a3b8' : '#5e6c84' }}>✖</button>
            </div>

            {(() => {
              const showProjectTab = !!currentProjectId && (!logsWorkspaceId || logsWorkspaceId === currentWorkspaceId);
              const showWsTab = !!logsWorkspaceId;
              const activeTab = logsTab === 'workspace' && showWsTab ? 'workspace' : (showProjectTab ? 'project' : 'workspace');
              const logsWsName = workspaces.find(w => w.id === logsWorkspaceId)?.name;
              const tabStyle = (active) => ({
                flex: 1, padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px',
                background: active ? '#0052cc' : (isDark ? '#334155' : '#dfe6e9'),
                color: active ? '#fff' : (isDark ? '#cbd5e1' : '#2d3436')
              });
              const list = activeTab === 'workspace' ? workspaceLogs : logs;

              const getBadge = (action = '') => {
                if (action.includes('şifresini')) return { text: '🔑 Şifre', bg: isDark ? '#422006' : '#fff0b3', color: isDark ? '#fde68a' : '#7a5a00' };
                if (action.includes('alan adını')) return { text: '✏️ Alan Adı', bg: isDark ? '#1e3a8a' : '#deebff', color: isDark ? '#93c5fd' : '#0747a6' };
                if (action.includes('admin')) return { text: '⭐ Yetki', bg: isDark ? '#78350f' : '#ffeaa7', color: isDark ? '#fde68a' : '#d35400' };
                if (action.includes('ayrıldı') || action.includes('çıkardı')) return { text: '🚪 Üyelik', bg: isDark ? '#450a0a' : '#ffebe6', color: isDark ? '#fca5a5' : '#bf2600' };
                if (action.includes('katıldı')) return { text: '👋 Üyelik', bg: isDark ? '#064e3b' : '#e3fcef', color: isDark ? '#6ee7b7' : '#006644' };
                return null;
              };

              return (
                <>
                  {showProjectTab && showWsTab && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setLogsTab('project')} style={tabStyle(activeTab === 'project')}>📋 Proje</button>
                      <button onClick={() => setLogsTab('workspace')} style={tabStyle(activeTab === 'workspace')}>🏢 Alan</button>
                    </div>
                  )}
                  {activeTab === 'workspace' && logsWsName && (
                    <small style={{ color: isDark ? '#94a3b8' : '#5e6c84', marginTop: '-6px' }}>
                      🏢 <strong>{logsWsName}</strong> alanına ait değişiklikler (anlık güncellenir)
                    </small>
                  )}

                  <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
                    {list.length === 0 ? (
                      <p style={{ color: isDark ? '#94a3b8' : '#5e6c84', textAlign: 'center' }}>Henüz bir hareket kaydedilmemiş.</p>
                    ) : (
                      list.map(log => {
                        const badge = activeTab === 'workspace' ? getBadge(log.action) : null;
                        return (
                          <div key={`${activeTab}-${log.id}`} style={{ padding: '12px', background: isDark ? '#0f172a' : '#fff', border: isDark ? '1px solid #334155' : 'none', borderRadius: '4px', boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)' }}>
                            {badge && (
                              <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '3px', marginBottom: '6px', background: badge.bg, color: badge.color }}>
                                {badge.text}
                              </span>
                            )}
                            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: isDark ? '#f8fafc' : '#172b4d', wordBreak: 'break-word' }}>
                              <strong>{log.user?.name || 'Bilinmeyen Kullanıcı'}</strong> {log.action}
                            </p>
                            <small style={{ color: isDark ? '#94a3b8' : '#888', fontSize: '11px' }}>
                              {new Date(log.createdAt).toLocaleString('tr-TR')}
                            </small>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
      {/* KULLANICI YÖNETİMİ MODALI (SADECE OWNER) */}
      {showUsersModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#1e293b' : '#f4f5f7', border: isDark ? '1px solid #334155' : 'none', padding: '24px', borderRadius: '8px', width: '95%', maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: isDark ? '#f8fafc' : '#172b4d' }}>👥 Kullanıcı Yönetimi</h3>
              <button onClick={() => setShowUsersModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: isDark ? '#94a3b8' : '#5e6c84' }}>✖</button>
            </div>
            
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
              {usersList.length === 0 ? (
                <p style={{ color: isDark ? '#94a3b8' : '#5e6c84', textAlign: 'center' }}>Kullanıcı bulunamadı.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: '450px', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: isDark ? '#0f172a' : '#fff', color: isDark ? '#f8fafc' : '#172b4d', borderRadius: '4px', overflow: 'hidden' }}>
                  <thead style={{ backgroundColor: isDark ? '#334155' : '#e4f0f6', color: isDark ? '#f8fafc' : '#172b4d' }}>
                    <tr>
                      <th style={{ padding: '10px' }}>İsim</th>
                      <th style={{ padding: '10px' }}>E-posta</th>
                      <th style={{ padding: '10px' }}>Yetki</th>
                      <th style={{ padding: '10px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id} style={{ borderBottom: isDark ? '1px solid #1e293b' : '1px solid #ebecf0' }}>
                        <td style={{ padding: '10px' }}>{u.name}</td>
                        <td style={{ padding: '10px' }}>{u.email}</td>
                        <td style={{ padding: '10px' }}>
                          <select 
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={u.role === 'owner'}
                            style={{ padding: '5px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #ccc', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f8fafc' : '#172b4d' }}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            {u.role === 'owner' && <option value="owner">Owner</option>}
                          </select>
                        </td>
                        <td style={{ padding: '10px' }}>
                          {u.role !== 'owner' && (
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              style={{ background: '#ff5630', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Sil
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* WORKSPACE OLUŞTUR / KATIL MODALI */}
      {showWorkspaceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#1e293b' : '#f4f5f7', border: isDark ? '1px solid #334155' : 'none', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: isDark ? '#f8fafc' : '#172b4d' }}>🏢 Çalışma Alanı</h3>
              <button onClick={() => setShowWorkspaceModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: isDark ? '#94a3b8' : '#5e6c84' }}>✖</button>
            </div>

            {/* Tab Butonları */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setWorkspaceTab('create')}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
                  background: workspaceTab === 'create' ? '#6c5ce7' : (isDark ? '#334155' : '#dfe6e9'), color: workspaceTab === 'create' ? '#fff' : (isDark ? '#cbd5e1' : '#2d3436')
                }}
              >
                ✨ Yeni Oluştur
              </button>
              <button 
                onClick={() => setWorkspaceTab('join')}
                style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold',
                  background: workspaceTab === 'join' ? '#6c5ce7' : (isDark ? '#334155' : '#dfe6e9'), color: workspaceTab === 'join' ? '#fff' : (isDark ? '#cbd5e1' : '#2d3436')
                }}
              >
                🔗 Alana Katıl
              </button>
            </div>

            {workspaceTab === 'create' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="text" placeholder="Çalışma Alanı Adı" value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  autoComplete="off"
                  style={{ padding: '10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #ccc', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f8fafc' : '#000', fontSize: '14px' }}
                />
                <input 
                  type="password" placeholder="Şifre (min 4 karakter)" value={newWsPassword}
                  onChange={(e) => setNewWsPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ padding: '10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #ccc', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f8fafc' : '#000', fontSize: '14px' }}
                />
                <button 
                  onClick={handleCreateWorkspace}
                  style={{ padding: '10px', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Oluştur
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="text" placeholder="Davet Kodu (Örn: A3F2B1C9)" value={joinWsId}
                  onChange={(e) => setJoinWsId(e.target.value)}
                  autoComplete="off"
                  style={{ padding: '10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #ccc', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f8fafc' : '#000', fontSize: '14px' }}
                />
                <input 
                  type="password" placeholder="Şifre" value={joinWsPassword}
                  onChange={(e) => setJoinWsPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ padding: '10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #ccc', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f8fafc' : '#000', fontSize: '14px' }}
                />
                <button 
                  onClick={handleJoinWorkspace}
                  style={{ padding: '10px', background: '#00b894', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Katıl
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WORKSPACE ÜYELERİ VE AYARLARI MODALI */}
      {showWsMembersModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#1e293b' : '#f4f5f7', border: isDark ? '1px solid #334155' : 'none', padding: '24px', borderRadius: '8px', width: '92%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px'
          }}>
            {/* Başlık ve Davet Kodu */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ margin: 0, color: isDark ? '#f8fafc' : '#172b4d', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>👥 {wsModal?.name || 'Çalışma Alanı'}</span>
                  {wsModal?.inviteCode && (
                    <span 
                      onClick={() => { navigator.clipboard.writeText(wsModal.inviteCode); showToast("Davet kodu kopyalandı!", "success"); }}
                      title="Kopyalamak için tıklayın"
                      style={{ 
                        fontSize: '11px', background: isDark ? '#2e1065' : '#e8e6fb', color: isDark ? '#c4b5fd' : '#6c5ce7', 
                        padding: '3px 7px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace' 
                      }}
                    >
                      Kod: {wsModal.inviteCode} 📋
                    </span>
                  )}
                </h3>
                <small style={{ color: isDark ? '#94a3b8' : '#5e6c84', fontSize: '11.5px' }}>
                  Rolünüz: <strong>{wsModalIsAdmin ? '⭐ Alan Yöneticisi (Admin)' : '👤 Üye'}</strong> · Toplam {wsModalMembers.length} üye ({wsModalAdminCount} admin)
                </small>
              </div>
              <button 
                onClick={() => { setShowWsMembersModal(false); setWsModalId(null); setWsLeaveWarning(''); }} 
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: isDark ? '#94a3b8' : '#5e6c84' }}
              >
                ✖
              </button>
            </div>

            {/* Uyarı Kutusu (Örn: Tek admin ayrılmaya çalıştığında) */}
            {wsLeaveWarning && (
              <div style={{
                backgroundColor: isDark ? '#450a0a' : '#ffebe6',
                color: isDark ? '#fca5a5' : '#bf2600',
                border: isDark ? '1px solid #7f1d1d' : '1px solid #ffbdad',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: '500',
                lineHeight: '1.4'
              }}>
                ⚠️ {wsLeaveWarning}
              </div>
            )}

            {/* Üyeler Listesi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: isDark ? '#cbd5e1' : '#475569' }}>
                👥 Alan Üyeleri ({wsModalMembers.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '2px' }}>
                {wsModalMembers.length === 0 ? (
                  <p style={{ color: isDark ? '#94a3b8' : '#5e6c84', textAlign: 'center', margin: '8px 0' }}>Üye bulunamadı.</p>
                ) : (
                  wsModalMembers.map(m => {
                    const isSelf = m.user?.id === user?.id;
                    const isMemberAdmin = m.role === 'ADMIN';

                    return (
                      <div 
                        key={m.id || m.user?.id} 
                        style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                          padding: '9px 12px', background: isDark ? '#0f172a' : '#fff', 
                          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
                          borderRadius: '6px', gap: '10px', flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ minWidth: '140px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ color: isDark ? '#f8fafc' : '#172b4d', fontSize: '13px' }}>
                              {m.user?.name}
                            </strong>
                            {isSelf && (
                              <span style={{ fontSize: '10px', background: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#cbd5e1' : '#475569', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                                Siz
                              </span>
                            )}
                          </div>
                          <small style={{ display: 'block', color: isDark ? '#94a3b8' : '#64748b', fontSize: '11px' }}>
                            {m.user?.email}
                          </small>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold',
                            background: isMemberAdmin ? (isDark ? '#78350f' : '#ffeaa7') : (isDark ? '#334155' : '#dfe6e9'),
                            color: isMemberAdmin ? (isDark ? '#fde68a' : '#d35400') : (isDark ? '#cbd5e1' : '#475569')
                          }}>
                            {isMemberAdmin ? '⭐ Admin' : '👤 Üye'}
                          </span>

                          {/* Yetki Değiştirme ve Çıkarma Butonları (Sadece Admin yetkisi olanlar yönetebilir) */}
                          {wsModalIsAdmin && (
                            <>
                              {!isMemberAdmin ? (
                                <button
                                  onClick={() => handleChangeMemberRole(m.user?.id, 'ADMIN')}
                                  title="Bu üyeye admin yetkisi ver"
                                  style={{ 
                                    padding: '4px 8px', background: isDark ? '#1e3a8a' : '#e0e7ff', 
                                    color: isDark ? '#93c5fd' : '#3730a3', border: 'none', 
                                    borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' 
                                  }}
                                >
                                  ⭐ Admin Yap
                                </button>
                              ) : (
                                (!isSelf || wsModalAdminCount > 1) && (
                                  <button
                                    onClick={() => handleChangeMemberRole(m.user?.id, 'MEMBER')}
                                    title={isSelf ? "Kendi adminlik yetkinizi bırakın" : "Admin yetkisini geri al"}
                                    style={{ 
                                      padding: '4px 8px', background: isDark ? '#422006' : '#fef3c7', 
                                      color: isDark ? '#fde68a' : '#92400e', border: 'none', 
                                      borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' 
                                    }}
                                  >
                                    {isSelf ? "Adminliği Bırak" : "Adminliği Al"}
                                  </button>
                                )
                              )}

                              {!isSelf && (
                                <button 
                                  onClick={() => handleKickMember(m.user?.id)}
                                  title="Üyeyi alandan çıkar"
                                  style={{ 
                                    padding: '4px 8px', background: '#ef4444', color: 'white', 
                                    border: 'none', borderRadius: '4px', cursor: 'pointer', 
                                    fontSize: '11px', fontWeight: 'bold' 
                                  }}
                                >
                                  Çıkar
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Alan Ayarları (Admin ise İsim ve Şifre değiştirme) */}
            {wsModalIsAdmin ? (
              <div style={{
                background: isDark ? '#0f172a' : '#fff',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: isDark ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⚙️ Alan Ayarları (Yalnızca Adminler)
                </span>

                {/* Alan Adı Değiştirme */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}>
                    ✏️ Çalışma Alanı Adı
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      value={wsRenameInput}
                      onChange={(e) => setWsRenameInput(e.target.value)}
                      placeholder="Yeni alan adı"
                      style={{ 
                        flex: 1, padding: '8px 10px', borderRadius: '4px', 
                        border: isDark ? '1px solid #334155' : '1px solid #ccc', 
                        background: isDark ? '#1e293b' : '#fff', 
                        color: isDark ? '#f8fafc' : '#000', fontSize: '13px' 
                      }}
                    />
                    <button 
                      onClick={handleRenameWorkspace}
                      style={{ 
                        padding: '8px 12px', background: '#0052cc', color: 'white', 
                        border: 'none', borderRadius: '4px', cursor: 'pointer', 
                        fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap' 
                      }}
                    >
                      Adı Güncelle
                    </button>
                  </div>
                </div>

                {/* Alan Şifresi Değiştirme */}
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}>
                    🔑 Alan Katılım Şifresi (En az 4 karakter)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input 
                        type="password"
                        value={wsNewPassword}
                        onChange={(e) => setWsNewPassword(e.target.value)}
                        placeholder="Yeni alan şifresi"
                        autoComplete="new-password"
                        style={{ 
                          flex: 1, minWidth: '130px', padding: '8px 10px', borderRadius: '4px', 
                          border: isDark ? '1px solid #334155' : '1px solid #ccc', 
                          background: isDark ? '#1e293b' : '#fff', 
                          color: isDark ? '#f8fafc' : '#000', fontSize: '13px' 
                        }}
                      />
                      <input 
                        type="password"
                        value={wsNewPasswordConfirm}
                        onChange={(e) => setWsNewPasswordConfirm(e.target.value)}
                        placeholder="Yeni şifre (tekrar)"
                        autoComplete="new-password"
                        style={{ 
                          flex: 1, minWidth: '130px', padding: '8px 10px', borderRadius: '4px', 
                          border: isDark ? '1px solid #334155' : '1px solid #ccc', 
                          background: isDark ? '#1e293b' : '#fff', 
                          color: isDark ? '#f8fafc' : '#000', fontSize: '13px' 
                        }}
                      />
                    </div>
                    <button 
                      onClick={handleChangeWorkspacePassword}
                      style={{ 
                        padding: '8px 12px', background: '#00b894', color: 'white', 
                        border: 'none', borderRadius: '4px', cursor: 'pointer', 
                        fontWeight: 'bold', fontSize: '12px', alignSelf: 'flex-start' 
                      }}
                    >
                      Şifreyi Güncelle
                    </button>
                  </div>
                  <small style={{ display: 'block', color: isDark ? '#94a3b8' : '#888', fontSize: '11px', marginTop: '4px' }}>
                    ℹ️ Şifre değiştiğinde tüm üyelere "Son Değişiklikler" üzerinden bilgilendirme iletilir.
                  </small>
                </div>
              </div>
            ) : (
              <div style={{ 
                padding: '10px 12px', background: isDark ? '#0f172a' : '#fff', 
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
                borderRadius: '6px', fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' 
              }}>
                ℹ️ Alan adı ve şifresi yalnızca alan adminleri tarafından değiştirilebilir.
              </div>
            )}

            {/* Alandan Ayrılma Bölümü */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0', 
              paddingTop: '12px', marginTop: '2px', flexWrap: 'wrap', gap: '8px' 
            }}>
              <div style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', flex: 1, minWidth: '180px' }}>
                {wsModalIsAdmin && wsModalAdminCount <= 1 && wsModalMembers.length > 1 ? (
                  <span style={{ color: isDark ? '#fca5a5' : '#dc2626', fontWeight: '500' }}>
                    ⚠️ Tek adminsiniz. Ayrılmadan önce yeni admin atamalısınız.
                  </span>
                ) : wsModalMembers.length <= 1 ? (
                  <span style={{ color: isDark ? '#fca5a5' : '#dc2626', fontWeight: '500' }}>
                    ⚠️ Son üyesiniz. Ayrılırsanız bu alan silinir.
                  </span>
                ) : (
                  <span>İstediğiniz zaman bu alandan ayrılabilirsiniz.</span>
                )}
              </div>

              <button 
                onClick={handleLeaveWorkspace}
                style={{ 
                  padding: '8px 14px', background: '#dc2626', color: 'white', 
                  border: 'none', borderRadius: '4px', cursor: 'pointer', 
                  fontWeight: 'bold', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' 
                }}
              >
                🚪 Alandan Ayrıl
              </button>
            </div>
          </div>
        </div>
      )}
      {/* HESAP YÖNETİMİ MODALI */}
      {showAccountModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: isDark ? '#1e293b' : '#f4f5f7', border: isDark ? '1px solid #334155' : 'none', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: isDark ? '#f8fafc' : '#172b4d' }}>⚙️ Hesap Yönetimi</h3>
              <button onClick={() => setShowAccountModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: isDark ? '#94a3b8' : '#5e6c84' }}>✖</button>
            </div>

            <div style={{ background: isDark ? '#0f172a' : '#fff', padding: '15px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#5e6c84', display: 'block' }}>Kullanıcı Adı</span>
                <strong style={{ fontSize: '14px', color: isDark ? '#f8fafc' : '#172b4d' }}>{currentUser.name}</strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#5e6c84', display: 'block' }}>E-posta</span>
                <strong style={{ fontSize: '14px', color: isDark ? '#f8fafc' : '#172b4d' }}>{user?.email || '-'}</strong>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#5e6c84', display: 'block' }}>Yetki Seviyesi</span>
                <strong style={{ fontSize: '14px', color: isDark ? '#60a5fa' : '#0052cc' }}>{currentUser.role}</strong>
              </div>
            </div>

            
              <div style={{ background: isDark ? '#0f172a' : '#fff', padding: '15px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6' }}>
                <h4 style={{ margin: '0 0 12px 0', color: isDark ? '#f8fafc' : '#172b4d', fontSize: '14px' }}>🔒 Şifreyi Değiştir</h4>
                
                {changePasswordError && (
                  <div style={{ backgroundColor: isDark ? '#450a0a' : '#ffebe6', color: isDark ? '#fca5a5' : '#bf2600', padding: '8px 12px', borderRadius: '4px', border: isDark ? '1px solid #7f1d1d' : '1px solid #ffbdad', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                    {changePasswordError}
                  </div>
                )}
                {changePasswordSuccess && (
                  <div style={{ backgroundColor: isDark ? '#064e3b' : '#e6ffed', color: isDark ? '#6ee7b7' : '#0a5c36', padding: '8px 12px', borderRadius: '4px', border: isDark ? '1px solid #065f46' : '1px solid #b7ebc6', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                    {changePasswordSuccess}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input 
                    type="password" 
                    placeholder="Mevcut Şifre" 
                    value={changePasswordOld}
                    onChange={(e) => setChangePasswordOld(e.target.value)}
                    required
                    style={{ padding: '8px 10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f8fafc' : '#172b4d', fontSize: '13px' }}
                  />
                  <input 
                    type="password" 
                    placeholder="Yeni Şifre" 
                    value={changePasswordNew}
                    onChange={(e) => setChangePasswordNew(e.target.value)}
                    required
                    style={{ padding: '8px 10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f8fafc' : '#172b4d', fontSize: '13px' }}
                  />
                  <input 
                    type="password" 
                    placeholder="Yeni Şifre (Tekrar)" 
                    value={changePasswordConfirm}
                    onChange={(e) => setChangePasswordConfirm(e.target.value)}
                    required
                    style={{ padding: '8px 10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f8fafc' : '#172b4d', fontSize: '13px' }}
                  />
                  
                  {/* Robot Kontrolü */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '5px' }}>
                    <div style={{ 
                      background: isDark ? '#334155' : '#e2e8f0', 
                      padding: '8px 12px', 
                      borderRadius: '4px', 
                      letterSpacing: '3px', 
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: isDark ? '#f8fafc' : '#1e293b',
                      userSelect: 'none'
                    }}>
                      {changePasswordCaptchaCode}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Kodu girin" 
                      value={changePasswordCaptchaInput}
                      onChange={(e) => setChangePasswordCaptchaInput(e.target.value)}
                      required
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #dfe1e6', background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f8fafc' : '#172b4d', fontSize: '13px' }}
                    />
                  </div>

                  <button 
                    type="submit"
                    style={{ padding: '10px', background: '#0052cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginTop: '5px' }}
                  >
                    Şifreyi Değiştir
                  </button>
                </form>
              </div>

              <div style={{ background: isDark ? '#3b1219' : '#fff0f0', padding: '15px', borderRadius: '6px', border: isDark ? '1px solid #7f1d1d' : '1px solid #ffbdad' }}>
              <h4 style={{ margin: '0 0 8px 0', color: isDark ? '#fca5a5' : '#bf2600', fontSize: '14px' }}>⚠️ Hesabı Sil</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: isDark ? '#f87171' : '#5e6c84' }}>
                Hesabınızı sildiğinizde oluşturduğunuz tüm veriler kalıcı olarak temizlenecektir.
              </p>

              {deleteAccountError && (
                <div style={{
                  backgroundColor: isDark ? '#450a0a' : '#ffebe6', color: isDark ? '#fca5a5' : '#bf2600', padding: '8px 12px', borderRadius: '4px',
                  border: isDark ? '1px solid #7f1d1d' : '1px solid #ffbdad', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold'
                }}>
                  {deleteAccountError}
                </div>
              )}

              <form onSubmit={handleDeleteMyAccount} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="password" 
                  placeholder="Onay için mevcut şifrenizi girin" 
                  value={deleteAccountPassword}
                  onChange={(e) => setDeleteAccountPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ padding: '8px 10px', borderRadius: '4px', border: isDark ? '1px solid #7f1d1d' : '1px solid #ccc', background: isDark ? '#0f172a' : '#fff', color: isDark ? '#f8fafc' : '#000', fontSize: '13px' }}
                />
                <button 
                  type="submit"
                  style={{ padding: '10px', background: '#ff5630', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
                >
                  Hesabımı Kalıcı Olarak Sil
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* UYGULAMA REHBERİ & GEZİ TURU MODALI */}
      <TourModal isOpen={showTourModal} onClose={() => setShowTourModal(false)} />

    </div>
  );
}