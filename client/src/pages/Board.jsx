/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/useAuthStore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Board() {
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
  }, [currentProjectId]);

  const handleAddProject = async () => {
    if (!newProjectName) return;
    try {
      await api.post('/projects', { name: newProjectName });
      setNewProjectName('');
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Proje eklenemedi:', error);
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
        if (currentProjectId === confirmDialog.id) setCurrentProjectId(null);
        const response = await api.get('/projects');
        setProjects(response.data);
        showToast("Proje başarıyla silindi.", "success");
      } catch (error) {
        if (error.response && error.response.status === 403) {
          showToast("Bu işlemi gerçekleştirmek için Admin yetkisine sahip olmalısınız veya proje size ait olmalı!", "error");
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
    delete api.defaults.headers.common['Authorization'];
    navigate('/login'); 
  };

  const handleAddTask = async (columnId) => {
    const text = newTaskText[columnId];
    if (!text || text.trim() === '') return;

    try {
      await api.post('/tasks', {
        title: text,
        columnId: parseInt(columnId),
        projectId: currentProjectId
      });

      setNewTaskText(prev => ({ ...prev, [columnId]: '' }));
      await fetchBoardData();
    } catch (error) {
      console.error('Görev eklenemedi:', error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    try {
      await api.put(`/tasks/${editingTask.id}`, {
        title: editingTask.title,
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
    if (!currentProjectId) return;
    try {
      const response = await api.get(`/projects/${currentProjectId}/logs`);
      setLogs(response.data);
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
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          backgroundColor: toastMessage.type === 'error' ? '#ffebe6' : '#e3fcef',
          color: toastMessage.type === 'error' ? '#bf2600' : '#006644',
          border: `1px solid ${toastMessage.type === 'error' ? '#ffbdad' : '#abf5d1'}`,
          padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          {toastMessage.message}
        </div>
      )}

      {confirmDialog.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 2000,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '8px', width: '350px', textAlign: 'center' }}>
            <h3 style={{ marginTop: 0, color: '#172b4d' }}>Emin misiniz?</h3>
            <p style={{ color: '#5e6c84', marginBottom: '25px' }}>
              Bu {confirmDialog.type === 'project' ? 'projeyi' : 'görevi'} silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <button 
                onClick={() => setConfirmDialog({ isOpen: false, type: '', id: null, columnId: null })}
                style={{ flex: 1, padding: '10px', background: '#e4f0f6', color: '#0079bf', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
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

      <aside className="sidebar">
        <h3>Projelerim</h3>
        <ul>
          {projects.map((project) => (
            <li 
              key={project.id} 
              className={currentProjectId === project.id ? 'active' : ''}
              onClick={() => setCurrentProjectId(project.id)}
              style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>{project.name}</span>
                <button 
                  onClick={(e) => triggerDeleteProject(project.id, e)}
                  style={{ background: 'transparent', border: 'none', color: '#ff9999', cursor: 'pointer', fontWeight: 'bold' }}
                  title="Projeyi Sil"
                >
                  X
                </button>
              </div>
              {project.user && (
                <small style={{ fontSize: '11px', color: '#a5b1c2' }}>
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
          />
          <button onClick={handleAddProject}>+ Proje Ekle</button>
        </div>
      </aside>

      <main className="board">
        <header className="board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h2>{currentProjectId ? 'Proje Görevleri' : 'Kanban Panosu'}</h2>
            {currentProjectId && (
              <button 
                onClick={handleShowLogs}
                style={{ padding: '6px 12px', background: '#e4f0f6', color: '#0079bf', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                🕒 Son Değişiklikler
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
            <button onClick={handleLogout} className="logout-btn">Çıkış Yap</button>
          </div>
        </header>

        {currentProjectId ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="columns-container" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              
              {columns.map((column) => (
                <div key={column.id} className="column" style={{ background: '#ebecf0', padding: '10px', width: '280px', borderRadius: '5px' }}>
                  <h2 style={{ fontSize: '16px', margin: '0 0 10px 0', color: '#172b4d' }}>{column.title}</h2>
                  
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
                                  backgroundColor: snapshot.isDragging ? '#e6fcff' : '#fff',
                                  borderRadius: '4px',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'flex-start',
                                  cursor: 'pointer',
                                  borderLeft: task.color ? `6px solid ${task.color}` : 'none', 
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                                  <span style={{ wordBreak: 'break-word', paddingRight: '10px' }}>{task.title}</span>
                                  
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {task.dueDate && (
                                      <small style={{ color: '#5e6c84', fontSize: '11px' }}>
                                        📅 {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                                      </small>
                                    )}
                                    {task.description && (
                                      <small style={{ color: '#5e6c84', fontSize: '11px' }}>📝 Açıklama</small>
                                    )}
                                  </div>
                                  
                                  {task.user && (
                                    <small style={{ color: '#888', fontSize: '10px', marginTop: '4px', fontStyle: 'italic' }}>
                                      Ekleyen: {task.user.name}
                                    </small>
                                  )}

                                </div>
                                <button 
                                  onClick={(e) => triggerDeleteTask(column.id, task.id, e)}
                                  style={{ background: 'transparent', border: 'none', color: '#ff9999', cursor: 'pointer', fontWeight: 'bold' }}
                                  title="Görevi Sil"
                                >
                                  X
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
                      style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button
                      onClick={() => handleAddTask(column.id)}
                      style={{ padding: '8px 12px', background: '#0079bf', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Ekle
                    </button>
                  </div>

                </div>
              ))}

            </div>
          </DragDropContext>
        ) : (
          <p>Lütfen görevleri görmek için sol menüden bir proje seçin.</p>
        )}
      </main>

      {/* GÖREV DETAY MODALI */}
      {editingTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#f4f5f7', padding: '24px', borderRadius: '8px', width: '400px', display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#172b4d' }}>Görev Detayı</h3>
            
            <input 
              type="text" 
              value={editingTask.title} 
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '16px' }}
            />
            
            <textarea 
              placeholder="Daha detaylı bir açıklama ekle..."
              value={editingTask.description || ''}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #dfe1e6', minHeight: '100px', resize: 'vertical' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', color: '#5e6c84', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Etiket Rengi:
                <input 
                  type="color" 
                  value={editingTask.color || '#ffffff'} 
                  onChange={(e) => setEditingTask({ ...editingTask, color: e.target.value })}
                  style={{ cursor: 'pointer', border: 'none', width: '30px', height: '30px', padding: 0 }}
                />
              </label>

              <label style={{ fontSize: '14px', color: '#5e6c84', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Son Tarih:
                <input 
                  type="date" 
                  value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''} 
                  onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                  style={{ padding: '5px', borderRadius: '4px', border: '1px solid #dfe1e6' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button 
                onClick={() => setEditingTask(null)}
                style={{ padding: '8px 16px', background: '#e4f0f6', color: '#0079bf', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
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
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#f4f5f7', padding: '24px', borderRadius: '8px', width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#172b4d' }}>🕒 Son Değişiklikler</h3>
              <button onClick={() => setShowLogs(false)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#5e6c84' }}>✖</button>
            </div>
            
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
              {logs.length === 0 ? (
                <p style={{ color: '#5e6c84', textAlign: 'center' }}>Henüz bir hareket kaydedilmemiş.</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} style={{ padding: '12px', background: '#fff', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#172b4d' }}>
                      <strong>{log.user?.name || 'Bilinmeyen Kullanıcı'}</strong> {log.action}
                    </p>
                    <small style={{ color: '#888', fontSize: '11px' }}>
                      {new Date(log.createdAt).toLocaleString('tr-TR')}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* KULLANICI YÖNETİMİ MODALI (SADECE OWNER) */}
      {showUsersModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#f4f5f7', padding: '24px', borderRadius: '8px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '15px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#172b4d' }}>👥 Kullanıcı Yönetimi</h3>
              <button onClick={() => setShowUsersModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#5e6c84' }}>✖</button>
            </div>
            
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '5px' }}>
              {usersList.length === 0 ? (
                <p style={{ color: '#5e6c84', textAlign: 'center' }}>Kullanıcı bulunamadı.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
                  <thead style={{ backgroundColor: '#e4f0f6', color: '#172b4d' }}>
                    <tr>
                      <th style={{ padding: '10px' }}>İsim</th>
                      <th style={{ padding: '10px' }}>E-posta</th>
                      <th style={{ padding: '10px' }}>Yetki</th>
                      <th style={{ padding: '10px' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #ebecf0' }}>
                        <td style={{ padding: '10px' }}>{u.name}</td>
                        <td style={{ padding: '10px' }}>{u.email}</td>
                        <td style={{ padding: '10px' }}>
                          <select 
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={u.role === 'owner'}
                            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}