import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus, 
  Users, 
  UserCheck, 
  UserX,
  Shield,
  Download,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import LoadingSpinner, { TableSpinner } from '../../components/common/LoadingSpinner';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // حالة الفلاتر والبحث
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // حالة التحديد المتعدد
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // حالة النوافذ المنبثقة
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('create'); // create, edit, view

  // جلب المستخدمين
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await api.get(`/admin/users?${queryParams}`);
      
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('خطأ في جلب المستخدمين:', error);
      toast.error('فشل في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة المستخدم
  const updateUserStatus = async (userId, status) => {
    try {
      setActionLoading(userId);
      const response = await api.put(`/admin/users/${userId}`, { status });
      
      if (response.success) {
        setUsers(users.map(user => 
          user._id === userId ? { ...user, status } : user
        ));
        toast.success('تم تحديث حالة المستخدم بنجاح');
      }
    } catch (error) {
      console.error('خطأ في تحديث حالة المستخدم:', error);
      toast.error('فشل في تحديث حالة المستخدم');
    } finally {
      setActionLoading(null);
    }
  };

  // حذف مستخدم
  const deleteUser = async (userId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      return;
    }

    try {
      setActionLoading(userId);
      const response = await api.delete(`/admin/users/${userId}`);
      
      if (response.success) {
        setUsers(users.filter(user => user._id !== userId));
        toast.success('تم حذف المستخدم بنجاح');
      }
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      toast.error('فشل في حذف المستخدم');
    } finally {
      setActionLoading(null);
    }
  };

  // معالجة تغيير الفلاتر
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // تطبيق الفلاتر
  const applyFilters = () => {
    fetchUsers(1);
  };

  // إعادة تعيين الفلاتر
  const resetFilters = () => {
    setFilters({
      search: '',
      role: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // معالجة التحديد المتعدد
  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  // تحديد الكل
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
      setShowBulkActions(false);
    } else {
      setSelectedUsers(users.map(user => user._id));
      setShowBulkActions(true);
    }
  };

  // تصدير البيانات
  const exportUsers = async () => {
    try {
      const response = await api.get('/admin/users?export=true');
      // يمكن إضافة منطق التصدير هنا
      toast.success('تم تصدير البيانات بنجاح');
    } catch (error) {
      toast.error('فشل في تصدير البيانات');
    }
  };

  // تحميل البيانات عند بدء التطبيق
  useEffect(() => {
    fetchUsers();
  }, []);

  // إحصائيات سريعة
  const stats = {
    total: pagination.totalUsers,
    active: users.filter(user => user.status === 'active').length,
    inactive: users.filter(user => user.status === 'inactive').length,
    admins: users.filter(user => user.role === 'admin').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* العنوان والإحصائيات */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-600 mt-1">إدارة حسابات المستخدمين وصلاحياتهم</p>
        </div>
        <button
          onClick={() => {
            setModalMode('create');
            setSelectedUser(null);
            setShowUserModal(true);
          }}
          className="mt-4 lg:mt-0 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          إضافة مستخدم جديد
        </button>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-success-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-success-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm text-gray-600">المستخدمين النشطين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-warning-100 rounded-lg">
              <UserX className="w-6 h-6 text-warning-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm text-gray-600">المستخدمين غير النشطين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm text-gray-600">المشرفين</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
          </div>
        </div>
      </div>

      {/* أدوات البحث والفلترة */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* البحث */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في المستخدمين..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* فلتر الدور */}
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">جميع الأدوار</option>
            <option value="admin">مشرف</option>
            <option value="user">مستخدم</option>
          </select>

          {/* فلتر الحالة */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="suspended">محظور</option>
          </select>

          {/* ترتيب */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="createdAt-desc">الأحدث أولاً</option>
            <option value="createdAt-asc">الأقدم أولاً</option>
            <option value="name-asc">اسم أ-ي</option>
            <option value="name-desc">اسم ي-أ</option>
            <option value="lastLogin-desc">آخر دخول</option>
          </select>

          {/* أزرار الإجراءات */}
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              تطبيق
            </button>
            <button
              onClick={resetFilters}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* الإجراءات المتعددة */}
      {showBulkActions && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-primary-800 font-medium">
                تم تحديد {selectedUsers.length} مستخدم
              </span>
              <div className="flex gap-2">
                <button className="text-success-600 hover:text-success-700 font-medium">
                  تفعيل المحدد
                </button>
                <button className="text-warning-600 hover:text-warning-700 font-medium">
                  إلغاء تفعيل المحدد
                </button>
                <button className="text-danger-600 hover:text-danger-700 font-medium">
                  حذف المحدد
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedUsers([]);
                setShowBulkActions(false);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* جدول المستخدمين */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <TableSpinner />
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد مستخدمين</h3>
            <p className="text-gray-600">لم يتم العثور على أي مستخدمين بالمعايير المحددة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الدور</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">آخر دخول</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التسجيل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-badge ${
                        user.role === 'admin' ? 'status-info' : 'status-secondary'
                      }`}>
                        {user.role === 'admin' ? 'مشرف' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-badge ${
                        user.status === 'active' ? 'status-success' :
                        user.status === 'inactive' ? 'status-warning' : 'status-danger'
                      }`}>
                        {user.status === 'active' ? 'نشط' :
                         user.status === 'inactive' ? 'غير نشط' : 'محظور'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastLogin ? 
                        new Date(user.lastLogin).toLocaleDateString('ar-SA') : 
                        'لم يسجل دخول'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {actionLoading === user._id ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setModalMode('edit');
                                setShowUserModal(true);
                              }}
                              className="text-primary-600 hover:text-primary-700 p-1"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateUserStatus(
                                user._id, 
                                user.status === 'active' ? 'inactive' : 'active'
                              )}
                              className={`p-1 ${
                                user.status === 'active' 
                                  ? 'text-warning-600 hover:text-warning-700' 
                                  : 'text-success-600 hover:text-success-700'
                              }`}
                              title={user.status === 'active' ? 'إلغاء تفعيل' : 'تفعيل'}
                            >
                              {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteUser(user._id)}
                              className="text-danger-600 hover:text-danger-700 p-1"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* التنقل بين الصفحات */}
        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                عرض <span className="font-medium">{((pagination.currentPage - 1) * 10) + 1}</span> إلى{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * 10, pagination.totalUsers)}
                </span> من{' '}
                <span className="font-medium">{pagination.totalUsers}</span> نتيجة
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <button
                  onClick={() => fetchUsers(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;