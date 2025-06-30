import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  // 禁用大请求头
//   withCredentials: false,
  // 限制请求头大小
//   maxHeaderSize: 8192 // 8KB
})

// 请求拦截器：清理冗余头
instance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
},
  error => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

export default {
  createNote(noteData) {
    return instance.post('/notes', {
      ...noteData,
      // 确保类型正确
      userId: Number(noteData.userId),
      courseId: noteData.courseId ? Number(noteData.courseId) : null
    })
  },
  
  updateNote(id, noteData) {
    return instance.put(`/notes/${id}`, {
      ...noteData,
      id: Number(id),
      userId: Number(noteData.userId)
    })
  },
  
  getUserNotes(userId) {
    return instance.get(`/notes/user/${Number(userId)}`)
  },
  
  getNoteById(id) {
    return instance.get(`/notes/${id}`)
  },
  
  deleteNote(id) {
    return instance.delete(`/notes/${id}`)
  }
}