"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImportSettingsProps {
  website: {
    _id: string;
    domain: string;
    name: string;
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function ImportSettings({
  website,
  websiteId,
  onUpdate,
}: ImportSettingsProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file to import");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `/api/websites/${websiteId}/plausible-import`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        alert(
          data.message || `Imported ${data.imported || 0} records successfully`
        );
        setSelectedFile(null);
        // Reset file input
        const form = e.currentTarget;
        const fileInput = form.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = "";
        }
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to import data");
      }
    } catch (error) {
      console.error("Error importing data:", error);
      alert("Failed to import data");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section>
      <form className="custom-card" onSubmit={handleSubmit}>
        <div className="custom-card-head flex items-center gap-2">
          <Image
            alt="Plausible"
            loading="lazy"
            width={250}
            height={250}
            decoding="async"
            className="w-6"
            src="/icon-plausible-large.png"
            style={{ color: "transparent" }}
          />
          <span className="text-base font-bold text-[#242562] dark:text-[#8385ff]">
            Plausible
          </span>
        </div>
        <div className="space-y-3 p-4">
          <ul className="text-base-secondary list-inside list-decimal text-sm leading-relaxed">
            <li className="mb-2 list-item">
              Export your data from Plausible (
              <Link
                href="/docs/import-from-plausible"
                target="_blank"
                className="link"
              >
                tutorial
              </Link>
              )
            </li>
            <li className="list-item">Upload the zip file below</li>
          </ul>
          <input
            accept=".zip"
            className="file-input file-input-bordered file-input-sm w-full border-base-content/10 placeholder:opacity-60"
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button
            type="submit"
            className="btn btn-sm btn-block btn-simple"
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Importing..." : "Import"}
          </Button>
        </div>
      </form>
    </section>
  );
}
