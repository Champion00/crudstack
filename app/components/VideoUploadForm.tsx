"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { IKUploadResponse } from "imagekitio-next/dist/types/components/IKUpload/props";
import { Loader2, Edit2, Trash2, Eye, X, Check } from "lucide-react";
import { useNotification } from "./Notification";
import { apiClient } from "@/lib/api-client";
import FileUpload from "./FileUpload";
import Image from "next/image";

interface PhotoFormData {
  id?: string;
  title: string;
  description: string;
  photoUrl: string;
  points?: number;
}

interface Photo {
  id: string;
  title: string;
  description: string;
  photoUrl: string;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export default function PhotoUploadForm() {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PhotoFormData>({
    defaultValues: {
      title: "",
      description: "",
      photoUrl: "",
      points: 0,
    },
  });

  const photoUrl = watch("photoUrl");

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPhotos();
      setPhotos(response.data || []);
    } catch (error) {
      showNotification("Failed to fetch photos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = async (response: IKUploadResponse) => {
    const fullPhotoUrl = `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}${response.filePath}`;
    setValue("photoUrl", fullPhotoUrl);

    // Simulate smile detection and assign points
    const pointsEarned = Math.floor(Math.random() * 10) + 1; // Random points for demo
    setValue("points", pointsEarned);

    showNotification(`Photo uploaded! You earned ${pointsEarned} points 😄`, "success");
  };

  const handleUploadProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const onSubmit = async (data: PhotoFormData) => {
    if (!data.photoUrl) {
      showNotification("Please upload a photo first", "error");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && selectedPhoto) {
        await apiClient.updatePhoto(selectedPhoto.id, data);
        showNotification("Photo updated successfully!", "success");
      } else {
        await apiClient.createPhoto(data);
        showNotification("Photo uploaded successfully!", "success");
      }

      resetForm();
      fetchPhotos();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to save photo",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsEditing(true);

    setValue("title", photo.title);
    setValue("description", photo.description);
    setValue("photoUrl", photo.photoUrl);
    setValue("points", photo.points);

    document.getElementById("photo-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDelete = async (photoId: string) => {
    try {
      await apiClient.deletePhoto(photoId);
      showNotification("Photo deleted successfully!", "success");
      fetchPhotos();
      setDeleteConfirm(null);
    } catch (error) {
      showNotification("Failed to delete photo", "error");
    }
  };

  const resetForm = () => {
    reset();
    setIsEditing(false);
    setSelectedPhoto(null);
    setUploadProgress(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Photo Upload/Edit Form */}
      <div id="photo-form" className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isEditing ? "Edit Photo" : "Upload New Photo"}
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="btn btn-ghost btn-sm"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Title</span>
            </label>
            <input
              type="text"
              className={`input input-bordered ${errors.title ? "input-error" : ""}`}
              {...register("title", { required: "Title is required" })}
            />
            {errors.title && (
              <span className="text-error text-sm mt-1">{errors.title.message}</span>
            )}
          </div>

          {/* Description */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              className={`textarea textarea-bordered h-24 ${
                errors.description ? "textarea-error" : ""
              }`}
              {...register("description", { required: "Description is required" })}
            />
            {errors.description && (
              <span className="text-error text-sm mt-1">{errors.description.message}</span>
            )}
          </div>

          {/* Photo Upload */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Upload Photo</span>
            </label>
            <FileUpload
              fileType="image"
              onSuccess={handleUploadSuccess}
              onProgress={handleUploadProgress}
            />

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <progress
                  className="progress progress-primary w-full"
                  value={uploadProgress}
                  max="100"
                />
              </div>
            )}

            {photoUrl && (
              <div className="mt-4 p-3 bg-success/10 rounded-lg">
                <div className="flex items-center text-success">
                  <Check className="w-4 h-4 mr-2" />
                  <span>
                    Photo uploaded! Points earned: {watch("points")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-control pt-4">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || !photoUrl}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? "Updating..." : "Uploading..."}
                </>
              ) : (
                <>{isEditing ? "Update Photo" : "Upload Photo"}</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Photo List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Your Photos</h2>

        {loading && photos.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Eye className="w-12 h-12 mx-auto" />
            </div>
            <p className="text-gray-500">No photos uploaded yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Upload your first photo using the form above
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="card card-compact bg-base-100 shadow-md hover:shadow-lg transition-shadow"
              >
                <figure className="relative h-48">
                  <Image
                    src={photo.photoUrl}
                    alt={photo.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </figure>
                <div className="card-body">
                  <h3 className="card-title text-lg font-semibold line-clamp-1">
                    {photo.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-2 text-sm">
                    {photo.description}
                  </p>
                  <div className="text-xs text-gray-500 mt-2">
                    Points: {photo.points} • Uploaded {formatDate(photo.createdAt)}
                  </div>
                  <div className="card-actions justify-end mt-4">
                    <a
                      href={photo.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-ghost"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </a>
                    <button
                      onClick={() => handleEdit(photo)}
                      className="btn btn-sm btn-ghost"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    {deleteConfirm === photo.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="btn btn-sm btn-error"
                        >
                          <Check className="w-4 h-4" />
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="btn btn-sm btn-ghost"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(photo.id)}
                        className="btn btn-sm btn-ghost text-error hover:text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
