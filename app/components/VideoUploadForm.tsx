"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { IKUploadResponse } from "imagekitio-next/dist/types/components/IKUpload/props";
import { 
  Loader2, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  FileText, 
  Download,
  FileIcon,
  Upload,
  Search,
  Filter,
  Calendar,
  FileUp,
  RefreshCw
} from "lucide-react";
import Image from "next/image";

// Types
interface DocumentFormData {
  id?: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  category?: string;
  tags?: string[];
}

interface Document {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Mock API Client (Replace with your actual API calls)
const apiClient = {
  getDocuments: async () => {
    // Mock data - replace with actual API call
    return {
      data: [
        {
          id: "1",
          title: "Project Requirements",
          description: "Complete project requirements document",
          fileUrl: "https://example.com/doc1.pdf",
          fileName: "requirements.pdf",
          fileSize: 2048576,
          fileType: "pdf",
          category: "Project",
          tags: ["important", "draft"],
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-01-15T10:30:00Z"
        },
        {
          id: "2",
          title: "API Documentation",
          description: "API endpoints and specifications",
          fileUrl: "https://example.com/doc2.pdf",
          fileName: "api-docs.pdf",
          fileSize: 1048576,
          fileType: "pdf",
          category: "Technical",
          tags: ["api", "docs"],
          createdAt: "2024-01-10T14:20:00Z",
          updatedAt: "2024-01-12T09:15:00Z"
        }
      ]
    };
  },

  createDocument: async (data: DocumentFormData) => {
    // Mock API call
    console.log("Creating document:", data);
    return { success: true };
  },

  updateDocument: async (id: string, data: DocumentFormData) => {
    // Mock API call
    console.log("Updating document:", id, data);
    return { success: true };
  },

  deleteDocument: async (id: string) => {
    // Mock API call
    console.log("Deleting document:", id);
    return { success: true };
  }
};

// Notification Hook
const useNotification = () => {
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  return { showNotification };
};

// File Upload Component
const FileUpload = ({ 
  onSuccess, 
  onProgress 
}: { 
  onSuccess: (response: IKUploadResponse) => void; 
  onProgress: (progress: number) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload
    onProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      setTimeout(() => {
        onProgress(i);
        if (i === 100) {
          const mockResponse: IKUploadResponse = {
            filePath: `/uploads/${file.name}`,
            url: URL.createObjectURL(file),
            name: file.name,
            size: file.size,
            fileType: file.type
          };
          onSuccess(mockResponse);
        }
      }, i * 20);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      // Create a fake input event
      const event = {
        target: {
          files: [file]
        }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging 
          ? 'border-primary bg-primary/10' 
          : 'border-gray-300 hover:border-primary hover:bg-gray-50'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-medium">Drag & drop your file here</p>
            <p className="text-sm text-gray-500 mt-1">or click to browse</p>
          </div>
          <div className="text-xs text-gray-400">
            Supported: PDF, DOC, DOCX, TXT, JPG, PNG (Max: 10MB)
          </div>
        </div>
      </label>
    </div>
  );
};

// Main Component
export default function DocumentCRUDPage() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { showNotification } = useNotification();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DocumentFormData>({
    defaultValues: {
      title: "",
      description: "",
      fileUrl: "",
      fileName: "",
      fileType: "pdf",
      fileSize: 0,
      category: "General",
      tags: [],
    },
  });

  const fileUrl = watch("fileUrl");
  const fileType = watch("fileType");

  // Initialize with mock data
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDocuments();
      setDocuments(response.data || []);
    } catch (error) {
      showNotification("Failed to fetch documents", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (response: IKUploadResponse) => {
    const fullFileUrl = response.url || response.filePath;
    
    setValue("fileUrl", fullFileUrl);
    setValue("fileName", response.name || "document");
    setValue("fileSize", response.size || 0);
    
    // Get file type from response
    const fileExt = response.filePath?.split('.').pop()?.toLowerCase() || 
                   response.name?.split('.').pop()?.toLowerCase() || 
                   "pdf";
    setValue("fileType", fileExt);

    showNotification(`File uploaded successfully!`, "success");
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const onSubmit = async (data: DocumentFormData) => {
    if (!data.fileUrl) {
      showNotification("Please upload a file first", "error");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && selectedDocument) {
        await apiClient.updateDocument(selectedDocument.id, data);
        showNotification("Document updated successfully!", "success");
      } else {
        await apiClient.createDocument(data);
        showNotification("Document uploaded successfully!", "success");
      }

      resetForm();
      fetchDocuments();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to save document",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (document: Document) => {
    setSelectedDocument(document);
    setIsEditing(true);

    setValue("title", document.title);
    setValue("description", document.description);
    setValue("fileUrl", document.fileUrl);
    setValue("fileName", document.fileName);
    setValue("fileType", document.fileType);
    setValue("fileSize", document.fileSize);
    setValue("category", document.category);
    setValue("tags", document.tags);

    document.getElementById("document-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (documentId: string) => {
    try {
      await apiClient.deleteDocument(documentId);
      showNotification("Document deleted successfully!", "success");
      setDocuments(documents.filter(doc => doc.id !== documentId));
      setDeleteConfirm(null);
    } catch (error) {
      showNotification("Failed to delete document", "error");
    }
  };

  const resetForm = () => {
    reset();
    setIsEditing(false);
    setSelectedDocument(null);
    setUploadProgress(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes("pdf")) return <FileText className="w-6 h-6 text-red-500" />;
    if (type.includes("word") || type.includes("doc")) return <FileIcon className="w-6 h-6 text-blue-500" />;
    if (type.includes("excel") || type.includes("xls")) return <FileIcon className="w-6 h-6 text-green-500" />;
    if (type.includes("image")) return (
      <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">IMG</span>
      </div>
    );
    return <FileIcon className="w-6 h-6 text-gray-500" />;
  };

  const handleDownload = (document: Document) => {
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Download started", "success");
  };

  const handleView = (document: Document) => {
    if (document.fileType.includes("pdf")) {
      window.open(document.fileUrl, '_blank');
    } else if (document.fileType.includes("image")) {
      window.open(document.fileUrl, '_blank');
    } else {
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(document.fileUrl)}`, '_blank');
    }
  };

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description.toLowerCase().includes(searchLower) ||
          doc.fileName.toLowerCase().includes(searchLower) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    })
    .filter(doc => {
      if (filterCategory !== "all") {
        return doc.category === filterCategory;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const categories = Array.from(new Set(documents.map(doc => doc.category)));

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Document Manager</h1>
          <p className="text-gray-600 mt-2">Upload, manage, and organize your documents in one place</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-1">
            <div id="document-form" className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">
                    {isEditing ? "✏️ Edit Document" : "📤 Upload Document"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isEditing ? "Update your document details" : "Upload a new document"}
                  </p>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-ghost btn-sm text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Title */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Document Title *</span>
                  </label>
                  <input
                    type="text"
                    className={`input input-bordered w-full ${errors.title ? "input-error" : ""}`}
                    placeholder="Enter document title"
                    {...register("title", { 
                      required: "Title is required",
                      minLength: {
                        value: 3,
                        message: "Title must be at least 3 characters"
                      }
                    })}
                  />
                  {errors.title && (
                    <span className="text-error text-sm mt-1">{errors.title.message}</span>
                  )}
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Description *</span>
                  </label>
                  <textarea
                    className={`textarea textarea-bordered w-full h-32 ${
                      errors.description ? "textarea-error" : ""
                    }`}
                    placeholder="Describe your document..."
                    {...register("description", { 
                      required: "Description is required",
                      minLength: {
                        value: 10,
                        message: "Description must be at least 10 characters"
                      }
                    })}
                  />
                  {errors.description && (
                    <span className="text-error text-sm mt-1">{errors.description.message}</span>
                  )}
                </div>

                {/* Category */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Category</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    {...register("category")}
                  >
                    <option value="General">General</option>
                    <option value="Project">Project</option>
                    <option value="Technical">Technical</option>
                    <option value="Financial">Financial</option>
                    <option value="Legal">Legal</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                {/* File Upload */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Upload File *</span>
                  </label>
                  <FileUpload
                    onSuccess={handleUploadSuccess}
                    onProgress={handleUploadProgress}
                  />

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Uploading...</span>
                        <span className="font-medium">{uploadProgress}%</span>
                      </div>
                      <progress
                        className="progress progress-primary w-full h-2"
                        value={uploadProgress}
                        max="100"
                      />
                    </div>
                  )}

                  {fileUrl && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            {getFileIcon(fileType)}
                          </div>
                          <div className="ml-3">
                            <p className="font-semibold text-gray-800">{watch("fileName")}</p>
                            <p className="text-xs text-gray-600">
                              {fileType.toUpperCase()} • {formatFileSize(watch("fileSize") || 0)}
                            </p>
                          </div>
                        </div>
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="form-control pt-2">
                  <button
                    type="submit"
                    className={`btn w-full ${
                      isEditing ? "btn-warning" : "btn-primary"
                    } ${loading ? "loading" : ""}`}
                    disabled={loading || !fileUrl}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isEditing ? "Updating..." : "Uploading..."}
                      </>
                    ) : (
                      <>
                        {isEditing ? (
                          <>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Update Document
                          </>
                        ) : (
                          <>
                            <FileUp className="w-4 h-4 mr-2" />
                            Upload Document
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                      <div className="text-xs text-blue-500">Total Files</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatFileSize(documents.reduce((acc, doc) => acc + doc.fileSize, 0))}
                      </div>
                      <div className="text-xs text-green-500">Total Size</div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - Documents List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Search and Filter Bar */}
              <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search documents by title, description, or tags..."
                        className="input input-bordered w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="select select-bordered"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <select
                      className="select select-bordered"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name A-Z</option>
                    </select>
                    <button
                      onClick={fetchDocuments}
                      className="btn btn-ghost"
                      title="Refresh"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Documents List */}
              {loading && documents.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-gray-600">Loading documents...</p>
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No documents found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterCategory !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "Upload your first document using the form on the left"}
                  </p>
                  {searchTerm || filterCategory !== "all" ? (
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterCategory("all");
                      }}
                      className="btn btn-primary"
                    >
                      Clear Filters
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                    <span>Showing {filteredDocuments.length} of {documents.length} documents</span>
                    <span className="flex items-center">
                      <Filter className="w-4 h-4 mr-1" />
                      Sorted by {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Name"}
                    </span>
                  </div>

                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="group border border-gray-200 rounded-xl p-4 hover:border-primary hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-gray-50 rounded-lg group-hover:bg-primary/5 transition-colors">
                            {getFileIcon(doc.fileType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900 truncate">
                                  {doc.title}
                                </h3>
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                  {doc.description}
                                </p>
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {doc.category}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                              <span className="flex items-center">
                                <FileIcon className="w-4 h-4 mr-1" />
                                {doc.fileName}
                              </span>
                              <span>•</span>
                              <span className="font-medium">{formatFileSize(doc.fileSize)}</span>
                              <span>•</span>
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDateTime(doc.createdAt)}
                              </span>
                              {doc.tags.length > 0 && (
                                <>
                                  <span>•</span>
                                  <div className="flex flex-wrap gap-1">
                                    {doc.tags.map((tag, index) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleView(doc)}
                            className="btn btn-sm btn-ghost text-gray-500 hover:text-primary"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDownload(doc)}
                            className="btn btn-sm btn-ghost text-gray-500 hover:text-green-600"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleEdit(doc)}
                            className="btn btn-sm btn-ghost text-gray-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          
                          {deleteConfirm === doc.id ? (
                            <div className="flex items-center space-x-1 bg-red-50 rounded-lg p-1">
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="btn btn-sm btn-error btn-square"
                                title="Confirm Delete"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn btn-sm btn-ghost btn-square"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(doc.id)}
                              className="btn btn-sm btn-ghost text-gray-500 hover:text-error"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Last Modified */}
                      {doc.updatedAt !== doc.createdAt && (
                        <div className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                          Last modified: {formatDateTime(doc.updatedAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-3">💡 Tips & Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-blue-700 mb-1">Drag & Drop</div>
                  <div className="text-sm text-gray-600">Drag files directly into the upload area</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-blue-700 mb-1">Multi-Format Support</div>
                  <div className="text-sm text-gray-600">PDF, Word, Excel, Images, and more</div>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="font-medium text-blue-700 mb-1">Quick Actions</div>
                  <div className="text-sm text-gray-600">View, download, edit, or delete with one click</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}