import { useState, useRef } from "react";
import type { KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  maxTags?: number;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

export function TagsInput({
  value,
  onChange,
  onBlur,
  placeholder = "Type and press Enter to add tags",
  maxTags = 20,
  maxLength,
  disabled = false,
  className,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = Array.isArray(value) ? value : [];

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !tags.includes(trimmedTag) &&
      tags.length < maxTags &&
      trimmedTag.length > 0 &&
      (!maxLength || trimmedTag.length <= maxLength)
    ) {
      onChange([...tags, trimmedTag]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Enforce maxLength if provided
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    setInputValue(newValue);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const pastedTags = pastedText
      .split(",")
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);

    const newTags = [...tags];
    for (const tag of pastedTags) {
      if (!newTags.includes(tag) && newTags.length < maxTags) {
        newTags.push(tag);
      }
    }
    onChange(newTags);
    setInputValue("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "flex flex-wrap gap-2 min-h-[2.5rem] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          disabled && "cursor-not-allowed opacity-50",
          tags.length > 0 && "pb-2"
        )}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/20"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="rounded-full hover:bg-primary/20 p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={onBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={disabled || tags.length >= maxTags}
          maxLength={maxLength}
          className="flex-1 min-w-[120px] border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {tags.length > 0 && (
            <>
              {tags.length} tag{tags.length !== 1 ? "s" : ""} added
              {tags.length >= maxTags && (
                <span className="ml-1 text-destructive">
                  (Maximum {maxTags} tags)
                </span>
              )}
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          {maxLength && (
            <span className="text-muted-foreground/70">
              {inputValue.length}/{maxLength}
            </span>
          )}
          {tags.length < maxTags && (
            <span className="text-muted-foreground/70">
              Press Enter or comma to add
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
