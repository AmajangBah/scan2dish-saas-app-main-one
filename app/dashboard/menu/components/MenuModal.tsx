"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { X, Sparkles } from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { useState, useEffect, DragEvent } from "react";
import { MenuItem, MenuCategory } from "../types";

const categories: MenuCategory[] = ["Starters", "Mains", "Drinks", "Desserts"];

export default function MenuModal({
  open,
  onClose,
  onSave,
  itemToEdit,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
  itemToEdit?: MenuItem;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameTranslations, setNameTranslations] = useState<Record<string, string>>(
    {}
  );
  const [descriptionTranslations, setDescriptionTranslations] = useState<
    Record<string, string>
  >({});
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState<MenuCategory>("Mains");
  const [available, setAvailable] = useState(true);

  // Images + crop
  const [images, setImages] = useState<string[]>([]);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Drag state
  const [dragActive, setDragActive] = useState(false);

  // Nutrition tags
  const [tags, setTags] = useState({
    spicy: false,
    vegetarian: false,
    glutenFree: false,
  });

  // Variants
  const [variants, setVariants] = useState<{ label: string; price: number }[]>(
    []
  );

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setDescription(itemToEdit.description);
      setNameTranslations(itemToEdit.nameTranslations || {});
      setDescriptionTranslations(itemToEdit.descriptionTranslations || {});
      setPrice(itemToEdit.price);
      setCategory(itemToEdit.category);
      setAvailable(itemToEdit.available);
      setImages(itemToEdit.images || []);
      setTags(
        itemToEdit.tags || {
          spicy: false,
          vegetarian: false,
          glutenFree: false,
        }
      );
      setVariants(itemToEdit.variants || []);
    } else {
      setName("");
      setDescription("");
      setNameTranslations({});
      setDescriptionTranslations({});
      setPrice(0);
      setCategory("Mains");
      setAvailable(true);
      setImages([]);
      setTags({ spicy: false, vegetarian: false, glutenFree: false });
      setVariants([]);
    }
  }, [itemToEdit, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // --------------------------------------------
  // IMAGE UPLOAD + AUTO CROP
  // --------------------------------------------

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCropImage(url); // open cropper
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  };

  const completeCrop = async () => {
    // For demo, just push the original
    setImages((prev) => [...prev, cropImage as string]);
    setCropImage(null);
  };

  // --------------------------------------------
  // DRAG TO REORDER
  // --------------------------------------------

  const onDragEnd = (result: {destination?: {index: number} | null; source: {index: number}}) => {
    if (!result.destination) return;

    const reordered = [...images];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setImages(reordered);
  };

  // --------------------------------------------
  // AI DESCRIPTION GENERATION (stub)
  // --------------------------------------------

  const generateDescription = () => {
    setDescription(
      "A delicious, freshly prepared dish crafted with premium ingredients."
    );
  };

  // --------------------------------------------
  const handleSave = () => {
    onSave({
      id: itemToEdit ? itemToEdit.id : Date.now().toString(),
      name,
      description,
      nameTranslations,
      descriptionTranslations,
      price,
      category,
      available,
      images,
      tags,
      variants,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
    max-w-lg 
    w-full 
    max-h-[90vh] 
    overflow-y-auto 
    rounded-2xl
  "
      >
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold">
            {itemToEdit ? "Edit Menu Item" : "Add Menu Item"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 flex flex-col gap-4">
          {/* NAME */}
          <Input
            placeholder="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* DESCRIPTION */}
          <div className="relative">
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              size="sm"
              className="absolute top-2 right-2"
              onClick={generateDescription}
            >
              <Sparkles size={16} className="mr-1" /> AI
            </Button>
          </div>

          {/* TRANSLATIONS (OPTIONAL) */}
          <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="text-sm font-semibold">Translations (optional)</div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Français (fr)
                </div>
                <Input
                  placeholder="Name (FR)"
                  value={nameTranslations.fr ?? ""}
                  onChange={(e) =>
                    setNameTranslations((prev) => ({ ...prev, fr: e.target.value }))
                  }
                />
                <Textarea
                  placeholder="Description (FR)"
                  value={descriptionTranslations.fr ?? ""}
                  onChange={(e) =>
                    setDescriptionTranslations((prev) => ({
                      ...prev,
                      fr: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">
                  Español (es)
                </div>
                <Input
                  placeholder="Name (ES)"
                  value={nameTranslations.es ?? ""}
                  onChange={(e) =>
                    setNameTranslations((prev) => ({ ...prev, es: e.target.value }))
                  }
                />
                <Textarea
                  placeholder="Description (ES)"
                  value={descriptionTranslations.es ?? ""}
                  onChange={(e) =>
                    setDescriptionTranslations((prev) => ({
                      ...prev,
                      es: e.target.value,
                    }))
                  }
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* PRICE */}
          <Input
            type="number"
            placeholder="Base Price"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />

          {/* CATEGORY */}
          <select
            className="p-2 border rounded-md"
            value={category}
            onChange={(e) => setCategory(e.target.value as MenuCategory)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {/* AVAILABILITY */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
            />
            <span>Available</span>
          </div>

          {/* TAGS */}
          <div className="flex gap-3">
            {Object.entries({
              spicy: "Spicy 🌶️",
              vegetarian: "Vegetarian 🥗",
              glutenFree: "Gluten Free 🚫🌾",
            }).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-lg cursor-pointer border"
              >
                <input
                  type="checkbox"
                  checked={tags[key as keyof typeof tags]}
                  onChange={() =>
                    setTags((p) => ({
                      ...p,
                      [key]: !p[key as keyof typeof tags],
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>

          {/* DRAG & DROP UPLOAD */}
          <div
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition
                ${
                  dragActive
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-300"
                }`}
          >
            <p>Drag & drop (auto-crop square)</p>

            <input
              type="file"
              className="hidden"
              id="upload"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />

            <label
              htmlFor="upload"
              className="mt-2 inline-block px-4 py-1 bg-orange-500 text-white rounded-md cursor-pointer"
            >
              Upload
            </label>
          </div>

          {/* CROP MODAL */}
          {cropImage && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white w-[90%] rounded-xl overflow-hidden p-4">
                <div className="relative w-full h-64">
                  <Cropper
                    image={cropImage}
                    aspect={1}
                    crop={crop}
                    zoom={zoom}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, area) => setCroppedArea(area)}
                  />
                </div>

                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setCropImage(null)}>
                    Cancel
                  </Button>
                  <Button onClick={completeCrop}>Crop</Button>
                </div>
              </div>
            </div>
          )}

          {/* IMAGE GALLERY (DRAG TO REORDER) */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="images" direction="horizontal">
              {(provided) => (
                <div
                  className="flex gap-3 overflow-x-auto"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {images.map((img, index) => (
                    <Draggable key={img} draggableId={img} index={index}>
                      {(provided) => (
                        <div
                          className="relative w-28 h-28 shrink-0"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Image
                            src={img}
                            alt="menu"
                            fill
                            className="object-cover rounded-xl"
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* VARIANTS */}
          <div>
            <p className="font-semibold mb-2">Variants</p>

            {variants.map((v, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  placeholder="Label"
                  value={v.label}
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, label: e.target.value } : x
                      )
                    )
                  }
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) =>
                    setVariants((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, price: Number(e.target.value) } : x
                      )
                    )
                  }
                />
                <Button
                  variant="destructive"
                  onClick={() =>
                    setVariants((prev) => prev.filter((_, idx) => idx !== i))
                  }
                >
                  <X />
                </Button>
              </div>
            ))}

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                setVariants((p) => [...p, { label: "", price: 0 }])
              }
            >
              + Add Variant
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {itemToEdit ? "Update Item" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
