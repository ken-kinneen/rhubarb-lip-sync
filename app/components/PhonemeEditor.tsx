"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { PeaksInstance, PeaksOptions, SegmentDragEvent, Segment } from "peaks.js";
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    ZoomIn,
    ZoomOut,
    Scissors,
    Trash2,
    Merge,
    Undo,
    Redo,
    Volume2,
    ChevronLeft,
    ChevronRight,
    MousePointer2,
    Plus,
    Settings,
} from "lucide-react";
import { PhonemeData, MouthShape, MOUTH_SHAPE_INFO } from "@/app/lib/types";
import { formatTime } from "@/app/lib/audio-utils";

interface PhonemeEditorProps {
    audioUrl: string;
    phonemes: PhonemeData[];
    onPhonemesChange: (phonemes: PhonemeData[]) => void;
    duration: number;
    // Callbacks to sync with parent's playback state
    onTimeUpdate?: (time: number) => void;
    onPlayStateChange?: (isPlaying: boolean) => void;
    // Enable drag-and-drop insertion
    enableDragDrop?: boolean;
    // Settings callback
    onSettingsClick?: () => void;
}

// Color mapping for segments
const getSegmentColor = (shape: MouthShape): string => {
    return MOUTH_SHAPE_INFO[shape]?.color || "#666666";
};

// History entry for undo/redo
interface HistoryEntry {
    phonemes: PhonemeData[];
    description: string;
}

export function PhonemeEditor({ audioUrl, phonemes, onPhonemesChange, duration, onTimeUpdate, onPlayStateChange, enableDragDrop = true, onSettingsClick }: PhonemeEditorProps) {
    // Refs for Peaks.js containers
    const overviewContainerRef = useRef<HTMLDivElement>(null);
    const zoomContainerRef = useRef<HTMLDivElement>(null);
    const audioElementRef = useRef<HTMLAudioElement>(null);
    const peaksRef = useRef<PeaksInstance | null>(null);
    
    // Refs to hold latest values for use in Peaks.js event handlers (avoids stale closure)
    const phonemesRef = useRef<PhonemeData[]>(phonemes);
    phonemesRef.current = phonemes;
    
    const onPhonemesChangeRef = useRef(onPhonemesChange);
    onPhonemesChangeRef.current = onPhonemesChange;

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(256);
    const [isLoaded, setIsLoaded] = useState(false);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        segmentId: string;
        type: "segment" | "boundary";
        boundaryIndex?: number; // Index of the boundary (between segment[index] and segment[index+1])
    } | null>(null);

    // Selected boundary state (the divider between segments)
    const [selectedBoundaryIndex, setSelectedBoundaryIndex] = useState<number | null>(null);

    // Undo/Redo history
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Drag-and-drop state
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragDropTime, setDragDropTime] = useState<number | null>(null);

    // Add to history when phonemes change
    const addToHistory = useCallback(
        (newPhonemes: PhonemeData[], description: string) => {
            setHistory((prev) => {
                // Remove any redo entries
                const newHistory = prev.slice(0, historyIndex + 1);
                newHistory.push({ phonemes: newPhonemes, description });
                // Keep last 50 entries
                if (newHistory.length > 50) {
                    newHistory.shift();
                }
                return newHistory;
            });
            setHistoryIndex((prev) => Math.min(prev + 1, 49));
        },
        [historyIndex]
    );
    
    // Ref for addToHistory to use in Peaks.js event handlers
    const addToHistoryRef = useRef(addToHistory);
    addToHistoryRef.current = addToHistory;

    // Undo
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex((prev) => prev - 1);
            onPhonemesChange(history[historyIndex - 1].phonemes);
        }
    }, [history, historyIndex, onPhonemesChange]);

    // Redo
    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex((prev) => prev + 1);
            onPhonemesChange(history[historyIndex + 1].phonemes);
        }
    }, [history, historyIndex, onPhonemesChange]);

    // Get selected phoneme
    const selectedPhoneme = useMemo(() => {
        if (!selectedSegmentId) return null;
        const index = parseInt(selectedSegmentId.replace("segment-", ""), 10);
        return phonemes[index] || null;
    }, [selectedSegmentId, phonemes]);

    // Initialize Peaks.js
    useEffect(() => {
        if (!audioElementRef.current || !overviewContainerRef.current || !zoomContainerRef.current) {
            return;
        }

        // Destroy previous instance
        if (peaksRef.current) {
            peaksRef.current.destroy();
            peaksRef.current = null;
        }

        // Dynamic import to avoid SSR issues
        import("peaks.js").then((PeaksModule) => {
            const Peaks = PeaksModule.default;

            if (!audioElementRef.current) return;

            const options: PeaksOptions = {
                zoomview: {
                    container: zoomContainerRef.current,
                    waveformColor: "#8b5cf6",
                    playedWaveformColor: "#a855f7",
                    playheadColor: "#ffffff",
                    playheadTextColor: "#ffffff",
                    axisGridlineColor: "#333333",
                    axisLabelColor: "#6b6b6b",
                    wheelMode: "scroll",
                },
                overview: {
                    container: overviewContainerRef.current,
                    waveformColor: "#4a4a4a",
                    playedWaveformColor: "#8b5cf6",
                    playheadColor: "#ffffff",
                    highlightColor: "#8b5cf6",
                    highlightOffset: 1,
                },
                mediaElement: audioElementRef.current,
                webAudio: {
                    audioContext: new AudioContext(),
                },
                keyboard: false, // We handle our own keyboard events
                nudgeIncrement: 0.01,
                segmentOptions: {
                    overlay: true,
                    markers: true,
                    startMarkerColor: "#ffffff",
                    endMarkerColor: "#ffffff",
                    waveformColor: "rgba(255, 255, 255, 0.3)",
                    overlayLabelAlign: "center",
                    overlayLabelVerticalAlign: "middle",
                    overlayLabelPadding: 4,
                    overlayFontSize: 10,
                    overlayFontFamily: "ui-monospace, monospace",
                    overlayColor: "#ffffff",
                    overlayOpacity: 1,
                },
                zoomLevels: [64, 128, 256, 512, 1024, 2048, 4096],
            };

            Peaks.init(options, (err, peaks) => {
                if (err) {
                    console.error("Failed to initialize Peaks.js:", err);
                    return;
                }

                if (peaks) {
                    peaksRef.current = peaks;
                    setIsLoaded(true);

                    // Add segments for phonemes
                    updateSegments(peaks, phonemes, selectedSegmentId);

                    // Set up event listeners
                    peaks.on("segments.dragend", (event: SegmentDragEvent) => {
                        handleSegmentDrag(event);
                    });

                    // Emit time updates during segment dragging for real-time preview
                    peaks.on("segments.dragged", (event: SegmentDragEvent) => {
                        // Update time to the segment's current position during drag
                        const midTime = (event.segment.startTime + event.segment.endTime) / 2;
                        setCurrentTime(midTime);
                        onTimeUpdate?.(midTime);
                    });

                    peaks.on("segments.click", (event: { segment: Segment; evt?: MouseEvent }) => {
                        const segmentId = event.segment.id || null;
                        setSelectedSegmentId(segmentId);
                        setSelectedBoundaryIndex(null); // Clear boundary selection
                    });

                    // Handle right-click on segments via mousedown event
                    peaks.on("segments.mousedown", (event: { segment: Segment; evt?: MouseEvent }) => {
                        const segmentId = event.segment.id || null;

                        // Check if right-click
                        if (event.evt && event.evt.button === 2) {
                            event.evt.preventDefault();
                            event.evt.stopPropagation();
                            setSelectedSegmentId(segmentId);
                            setSelectedBoundaryIndex(null);
                            setContextMenu({
                                x: event.evt.clientX,
                                y: event.evt.clientY,
                                segmentId: segmentId || "",
                                type: "segment",
                            });
                        } else {
                            // Clear boundary selection when clicking a segment
                            setSelectedBoundaryIndex(null);
                        }
                    });

                    // Handle marker (boundary handle) events
                    peaks.on("segments.mouseenter", (event: { segment: Segment; evt?: MouseEvent }) => {
                        // Visual feedback when hovering could be added here
                    });

                    // Handle double-click on segment to select and show info
                    peaks.on("segments.dblclick", (event: { segment: Segment; evt?: MouseEvent }) => {
                        const segmentId = event.segment.id || null;
                        if (segmentId && peaksRef.current) {
                            const index = parseInt(segmentId.replace("segment-", ""), 10);
                            if (!isNaN(index) && index < phonemes.length) {
                                peaksRef.current.player.seek(phonemes[index].start);
                            }
                        }
                    });

                    peaks.on("player.timeupdate", (time: number) => {
                        setCurrentTime(time);
                        onTimeUpdate?.(time);
                    });

                    // Listen for zoomview seek events (when user clicks on waveform)
                    peaks.on("zoomview.click", (event: { time: number }) => {
                        setCurrentTime(event.time);
                        onTimeUpdate?.(event.time);
                    });

                    // Listen for overview seek events
                    peaks.on("overview.click", (event: { time: number }) => {
                        setCurrentTime(event.time);
                        onTimeUpdate?.(event.time);
                    });

                    peaks.on("player.playing", () => {
                        setIsPlaying(true);
                        onPlayStateChange?.(true);
                    });

                    peaks.on("player.pause", () => {
                        setIsPlaying(false);
                        onPlayStateChange?.(false);
                    });

                    // Set initial zoom
                    peaks.zoom.setZoom(2); // 256 samples per pixel
                }
            });
        });

        return () => {
            if (peaksRef.current) {
                peaksRef.current.destroy();
                peaksRef.current = null;
            }
        };
    }, [audioUrl]);

    // Update segments when phonemes change
    const updateSegments = useCallback((peaks: PeaksInstance, phonemeList: PhonemeData[], selectedId?: string | null) => {
        // Remove all existing segments
        peaks.segments.removeAll();

        // Add new segments with adaptive labels based on duration
        phonemeList.forEach((phoneme, index) => {
            const durationMs = (phoneme.end - phoneme.start) * 1000;
            const segmentId = `segment-${index}`;
            const isSelected = segmentId === selectedId;

            // Adaptive label based on segment duration
            // Very narrow (<80ms): just the letter
            // Narrow (80-200ms): letter + duration
            // Wide (>200ms): letter + short name + duration
            let labelText: string;
            if (durationMs < 80) {
                labelText = phoneme.value;
            } else if (durationMs < 200) {
                labelText = `${phoneme.value} ${durationMs.toFixed(0)}ms`;
            } else {
                const shortName = MOUTH_SHAPE_INFO[phoneme.value].name.split(/[-\/]/)[0].trim();
                labelText = `${phoneme.value} - ${shortName} (${durationMs.toFixed(0)}ms)`;
            }

            peaks.segments.add({
                id: segmentId,
                startTime: phoneme.start,
                endTime: phoneme.end,
                labelText,
                color: isSelected
                    ? getSegmentColor(phoneme.value) + "FF" // Full opacity for selected
                    : getSegmentColor(phoneme.value) + "99", // More visible default
                editable: true,
            });
        });
    }, []);

    // Sync segments when phonemes prop changes or selection changes
    useEffect(() => {
        if (peaksRef.current && isLoaded) {
            updateSegments(peaksRef.current, phonemes, selectedSegmentId);
        }
    }, [phonemes, isLoaded, selectedSegmentId, updateSegments]);

    // Handle segment drag - uses refs to always get latest values (avoids stale closure in Peaks.js events)
    const handleSegmentDrag = useCallback(
        (event: SegmentDragEvent) => {
            const segment = event.segment;
            const segmentId = segment.id;
            if (!segmentId) return;

            // Use refs to get the LATEST values (not stale closure values)
            const currentPhonemes = phonemesRef.current;
            
            const index = parseInt(segmentId.replace("segment-", ""), 10);
            if (isNaN(index) || index < 0 || index >= currentPhonemes.length) return;

            // Get the current phoneme data (preserves shape changes made via context menu)
            const currentPhoneme = currentPhonemes[index];
            
            // Clamp the new times to prevent overlapping with adjacent segments
            // Gaps are allowed, but overlaps are not
            let newStart = segment.startTime;
            let newEnd = segment.endTime;
            
            // Don't allow start to go before 0 or overlap with previous segment's end
            if (index > 0) {
                const prevEnd = currentPhonemes[index - 1].end;
                newStart = Math.max(newStart, prevEnd);
            } else {
                newStart = Math.max(newStart, 0);
            }
            
            // Don't allow end to overlap with next segment's start
            if (index < currentPhonemes.length - 1) {
                const nextStart = currentPhonemes[index + 1].start;
                newEnd = Math.min(newEnd, nextStart);
            }
            
            // Ensure minimum segment duration
            if (newEnd - newStart < 0.02) {
                return; // Don't allow segments smaller than 20ms
            }

            const newPhonemes = [...currentPhonemes];
            newPhonemes[index] = {
                ...currentPhoneme,
                start: newStart,
                end: newEnd,
            };

            // Use refs to call latest callbacks
            addToHistoryRef.current(newPhonemes, "Resize segment");
            onPhonemesChangeRef.current(newPhonemes);
        },
        [] // No dependencies - uses refs for all external values
    );

    // Change shape of selected segment
    const changeSelectedShape = useCallback(
        (newShape: MouthShape) => {
            if (!selectedSegmentId) return;

            const index = parseInt(selectedSegmentId.replace("segment-", ""), 10);
            if (isNaN(index) || index < 0 || index >= phonemes.length) return;

            const newPhonemes = [...phonemes];
            newPhonemes[index] = {
                ...newPhonemes[index],
                value: newShape,
            };

            addToHistory(newPhonemes, `Change to ${newShape}`);
            onPhonemesChange(newPhonemes);
        },
        [selectedSegmentId, phonemes, onPhonemesChange, addToHistory]
    );

    // Split segment at playhead
    const splitAtPlayhead = useCallback(() => {
        // Find segment at current time
        const segmentIndex = phonemes.findIndex((p) => currentTime >= p.start && currentTime < p.end);

        if (segmentIndex === -1) return;

        const segment = phonemes[segmentIndex];
        const splitTime = currentTime;

        // Don't split if too close to edges
        if (splitTime - segment.start < 0.02 || segment.end - splitTime < 0.02) return;

        const newPhonemes = [...phonemes];
        newPhonemes.splice(
            segmentIndex,
            1,
            { start: segment.start, end: splitTime, value: segment.value },
            { start: splitTime, end: segment.end, value: segment.value }
        );

        addToHistory(newPhonemes, "Split segment");
        onPhonemesChange(newPhonemes);
        setSelectedSegmentId(`segment-${segmentIndex + 1}`);
    }, [phonemes, currentTime, onPhonemesChange, addToHistory]);

    // Delete segment by ID or selected
    const deleteSegment = useCallback(
        (segmentId?: string) => {
            const targetId = segmentId || selectedSegmentId;
            if (!targetId) return;

            const index = parseInt(targetId.replace("segment-", ""), 10);
            if (isNaN(index) || index < 0 || index >= phonemes.length) return;

            // Can't delete if only one segment
            if (phonemes.length <= 1) return;

            const newPhonemes = [...phonemes];
            const deleted = newPhonemes.splice(index, 1)[0];

            // Extend adjacent segment to fill gap
            if (index > 0) {
                newPhonemes[index - 1] = {
                    ...newPhonemes[index - 1],
                    end: deleted.end,
                };
            } else if (newPhonemes.length > 0) {
                newPhonemes[0] = {
                    ...newPhonemes[0],
                    start: deleted.start,
                };
            }

            addToHistory(newPhonemes, "Delete segment");
            onPhonemesChange(newPhonemes);
            setSelectedSegmentId(null);
            setContextMenu(null);
        },
        [selectedSegmentId, phonemes, onPhonemesChange, addToHistory]
    );

    // Alias for backward compatibility
    const deleteSelected = useCallback(() => deleteSegment(), [deleteSegment]);

    // Merge selected segment with next
    const mergeWithNext = useCallback(() => {
        if (!selectedSegmentId) return;

        const index = parseInt(selectedSegmentId.replace("segment-", ""), 10);
        if (isNaN(index) || index < 0 || index >= phonemes.length - 1) return;

        const newPhonemes = [...phonemes];
        const current = newPhonemes[index];
        const next = newPhonemes[index + 1];

        newPhonemes.splice(index, 2, {
            start: current.start,
            end: next.end,
            value: current.value, // Keep current segment's shape
        });

        addToHistory(newPhonemes, "Merge segments");
        onPhonemesChange(newPhonemes);
    }, [selectedSegmentId, phonemes, onPhonemesChange, addToHistory]);

    // Insert a new shape at a specific time
    const insertShapeAtTime = useCallback(
        (shape: MouthShape, time: number) => {
            // Find which segment contains this time
            const segmentIndex = phonemes.findIndex((p) => time >= p.start && time < p.end);
            
            if (segmentIndex === -1) {
                // Time is outside all segments, insert at the end or beginning
                if (time >= (phonemes[phonemes.length - 1]?.end || 0)) {
                    // Insert at the end
                    const lastEnd = phonemes[phonemes.length - 1]?.end || 0;
                    const newPhonemes = [...phonemes, {
                        start: lastEnd,
                        end: Math.min(lastEnd + 0.1, duration),
                        value: shape,
                    }];
                    addToHistory(newPhonemes, `Insert ${shape}`);
                    onPhonemesChange(newPhonemes);
                }
                return;
            }

            const segment = phonemes[segmentIndex];
            const minDuration = 0.02; // Minimum segment duration

            // Don't split if too close to edges
            if (time - segment.start < minDuration || segment.end - time < minDuration) {
                // Just change the shape of the current segment instead
                const newPhonemes = [...phonemes];
                newPhonemes[segmentIndex] = { ...segment, value: shape };
                addToHistory(newPhonemes, `Change to ${shape}`);
                onPhonemesChange(newPhonemes);
                return;
            }

            // Split the segment and insert the new shape
            const insertDuration = Math.min(0.1, (segment.end - time) / 2); // New shape duration
            const newPhonemes = [...phonemes];
            
            newPhonemes.splice(
                segmentIndex,
                1,
                { start: segment.start, end: time, value: segment.value },
                { start: time, end: time + insertDuration, value: shape },
                { start: time + insertDuration, end: segment.end, value: segment.value }
            );

            addToHistory(newPhonemes, `Insert ${shape}`);
            onPhonemesChange(newPhonemes);
            setSelectedSegmentId(`segment-${segmentIndex + 1}`);
        },
        [phonemes, duration, onPhonemesChange, addToHistory]
    );

    // Insert shape at current playhead position
    const insertShapeAtPlayhead = useCallback(
        (shape: MouthShape) => {
            insertShapeAtTime(shape, currentTime);
        },
        [insertShapeAtTime, currentTime]
    );

    // Handle drag over for drop zone
    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            if (!enableDragDrop) return;
            
            const hasShape = e.dataTransfer.types.includes('application/x-mouth-shape');
            if (!hasShape) return;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            setIsDragOver(true);

            // Calculate drop time from mouse position
            const rect = zoomContainerRef.current?.getBoundingClientRect();
            if (!rect || !peaksRef.current || !duration) return;

            const view = peaksRef.current.views.getView('zoomview');
            if (!view) return;

            const startTime = view.getStartTime();
            const endTime = view.getEndTime();
            const visibleDuration = endTime - startTime;
            const clickRatio = (e.clientX - rect.left) / rect.width;
            const dropTime = startTime + clickRatio * visibleDuration;
            
            setDragDropTime(Math.max(0, Math.min(dropTime, duration)));
        },
        [enableDragDrop, duration]
    );

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
        setDragDropTime(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            
            const shape = e.dataTransfer.getData('application/x-mouth-shape') as MouthShape;
            if (!shape || !dragDropTime) {
                setDragDropTime(null);
                return;
            }

            insertShapeAtTime(shape, dragDropTime);
            setDragDropTime(null);
        },
        [dragDropTime, insertShapeAtTime]
    );

    // Delete boundary at specific index (merge segments on either side)
    const deleteBoundary = useCallback(
        (boundaryIndex: number) => {
            // boundaryIndex is the index of the LEFT segment (we merge segment[index] with segment[index+1])
            if (boundaryIndex < 0 || boundaryIndex >= phonemes.length - 1) return;

            const newPhonemes = [...phonemes];
            const left = newPhonemes[boundaryIndex];
            const right = newPhonemes[boundaryIndex + 1];

            // Merge: keep the left segment's shape, extend to cover both
            newPhonemes.splice(boundaryIndex, 2, {
                start: left.start,
                end: right.end,
                value: left.value,
            });

            addToHistory(newPhonemes, "Delete boundary (merge)");
            onPhonemesChange(newPhonemes);
            setSelectedBoundaryIndex(null);
            setContextMenu(null);
        },
        [phonemes, onPhonemesChange, addToHistory]
    );

    // Navigate to previous/next segment
    const goToPrevSegment = useCallback(() => {
        if (!selectedSegmentId) {
            if (phonemes.length > 0) setSelectedSegmentId("segment-0");
            return;
        }
        const index = parseInt(selectedSegmentId.replace("segment-", ""), 10);
        if (index > 0) {
            setSelectedSegmentId(`segment-${index - 1}`);
            if (peaksRef.current) {
                peaksRef.current.player.seek(phonemes[index - 1].start);
            }
        }
    }, [selectedSegmentId, phonemes]);

    const goToNextSegment = useCallback(() => {
        if (!selectedSegmentId) {
            if (phonemes.length > 0) setSelectedSegmentId("segment-0");
            return;
        }
        const index = parseInt(selectedSegmentId.replace("segment-", ""), 10);
        if (index < phonemes.length - 1) {
            setSelectedSegmentId(`segment-${index + 1}`);
            if (peaksRef.current) {
                peaksRef.current.player.seek(phonemes[index + 1].start);
            }
        }
    }, [selectedSegmentId, phonemes]);

    // Playback controls
    const togglePlayPause = useCallback(() => {
        if (!peaksRef.current) return;
        if (isPlaying) {
            peaksRef.current.player.pause();
        } else {
            peaksRef.current.player.play();
        }
    }, [isPlaying]);

    const seek = useCallback((time: number) => {
        if (!peaksRef.current) return;
        peaksRef.current.player.seek(time);
    }, []);

    // Zoom controls
    const zoomIn = useCallback(() => {
        if (!peaksRef.current) return;
        const levels = [64, 128, 256, 512, 1024, 2048, 4096];
        const currentIndex = levels.indexOf(zoomLevel);
        if (currentIndex > 0) {
            const newLevel = levels[currentIndex - 1];
            peaksRef.current.zoom.setZoom(currentIndex - 1);
            setZoomLevel(newLevel);
        }
    }, [zoomLevel]);

    const zoomOut = useCallback(() => {
        if (!peaksRef.current) return;
        const levels = [64, 128, 256, 512, 1024, 2048, 4096];
        const currentIndex = levels.indexOf(zoomLevel);
        if (currentIndex < levels.length - 1) {
            const newLevel = levels[currentIndex + 1];
            peaksRef.current.zoom.setZoom(currentIndex + 1);
            setZoomLevel(newLevel);
        }
    }, [zoomLevel]);

    // Close context menu on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu(null);
        };

        if (contextMenu) {
            window.addEventListener("click", handleClickOutside);
            return () => window.removeEventListener("click", handleClickOutside);
        }
    }, [contextMenu]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key) {
                case " ":
                    e.preventDefault();
                    togglePlayPause();
                    break;
                case "ArrowLeft":
                    if (e.shiftKey) {
                        seek(Math.max(0, currentTime - 0.1));
                    } else {
                        goToPrevSegment();
                    }
                    break;
                case "ArrowRight":
                    if (e.shiftKey) {
                        seek(Math.min(duration, currentTime + 0.1));
                    } else {
                        goToNextSegment();
                    }
                    break;
                case "s":
                case "S":
                    if (!e.metaKey && !e.ctrlKey) {
                        splitAtPlayhead();
                    }
                    break;
                case "Delete":
                case "Backspace":
                    if (!e.metaKey && !e.ctrlKey) {
                        e.preventDefault();
                        // Delete boundary if selected, otherwise delete segment
                        if (selectedBoundaryIndex !== null) {
                            deleteBoundary(selectedBoundaryIndex);
                        } else {
                            deleteSelected();
                        }
                    }
                    break;
                case "m":
                case "M":
                    mergeWithNext();
                    break;
                case "z":
                case "Z":
                    if (e.metaKey || e.ctrlKey) {
                        e.preventDefault();
                        if (e.shiftKey) {
                            redo();
                        } else {
                            undo();
                        }
                    }
                    break;
                case "+":
                case "=":
                    zoomIn();
                    break;
                case "-":
                    zoomOut();
                    break;
                // Number keys 1-9 for shapes A-H, X
                case "1":
                    changeSelectedShape("A");
                    break;
                case "2":
                    changeSelectedShape("B");
                    break;
                case "3":
                    changeSelectedShape("C");
                    break;
                case "4":
                    changeSelectedShape("D");
                    break;
                case "5":
                    changeSelectedShape("E");
                    break;
                case "6":
                    changeSelectedShape("F");
                    break;
                case "7":
                    changeSelectedShape("G");
                    break;
                case "8":
                    changeSelectedShape("H");
                    break;
                case "9":
                    changeSelectedShape("X");
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        togglePlayPause,
        goToPrevSegment,
        goToNextSegment,
        splitAtPlayhead,
        deleteSelected,
        deleteBoundary,
        selectedBoundaryIndex,
        mergeWithNext,
        undo,
        redo,
        zoomIn,
        zoomOut,
        changeSelectedShape,
        seek,
        currentTime,
        duration,
    ]);

    const mouthShapes: MouthShape[] = ["A", "B", "C", "D", "E", "F", "G", "H", "X"];

    return (
        <div className='card-base overflow-hidden' onContextMenu={(e) => e.preventDefault()}>
            {/* Custom styles for Peaks.js segments */}
            <style jsx global>{`
                /* Make segments more visible and interactive */
                .konvajs-content canvas {
                    cursor: pointer !important;
                }

                /* Segment handles */
                .peaks-segment-handle {
                    cursor: ew-resize !important;
                }

                /* Make segment overlays more visible */
                .konvajs-content {
                    user-select: none;
                }
            `}</style>

            {/* Header */}
            <div className='flex items-center justify-between px-6 py-3 border-b border-[#333333]'>
                <div className='flex items-center gap-3'>
                    <h2 className='text-lg font-semibold text-[#f5f5f5]'>Phoneme Editor</h2>
                    <span className='px-2 py-0.5 text-xs bg-[#8b5cf6]/20 text-[#8b5cf6] rounded-full'>{phonemes.length} segments</span>
                    <span className='hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-xs bg-[#333333] text-[#a8a8a8] rounded-full'>
                        <MousePointer2 className='w-3 h-3' />
                        Right-click segment to edit
                    </span>
                </div>
                <div className='flex items-center gap-3'>
                    <div className='flex items-center gap-2'>
                        <button onClick={zoomIn} className='btn-ghost p-1' title='Zoom in (+)'>
                            <ZoomIn className='w-4 h-4' />
                        </button>
                        <span className='text-xs text-[#6b6b6b] font-mono min-w-[50px] text-center'>{zoomLevel}x</span>
                        <button onClick={zoomOut} className='btn-ghost p-1' title='Zoom out (-)'>
                            <ZoomOut className='w-4 h-4' />
                        </button>
                    </div>
                    <div className='w-px h-5 bg-[#333333]' />
                    <span className='text-sm font-mono text-[#a8a8a8]'>
                        <span className='text-[#8b5cf6]'>{formatTime(currentTime)}</span>
                        <span className='text-[#4a4a4a] mx-1'>/</span>
                        <span>{formatTime(duration)}</span>
                    </span>
                    {onSettingsClick && (
                        <>
                            <div className='w-px h-5 bg-[#333333]' />
                            <button onClick={onSettingsClick} className='btn-ghost p-1.5' title='Shape Settings'>
                                <Settings className='w-4 h-4' />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Hidden audio element */}
            <audio ref={audioElementRef} src={audioUrl} crossOrigin='anonymous' />

            {/* Overview waveform (full timeline) */}
            <div className='relative bg-[#1a1a1a] border-b border-[#333333]'>
                <div className='text-[10px] uppercase tracking-wider text-[#6b6b6b] px-4 py-2'>Overview</div>
                <div ref={overviewContainerRef} className='w-full' style={{ height: "60px" }} />
            </div>

            {/* Zoomed waveform (detailed editing) */}
            <div className='relative bg-[#1e1e1e]'>
                <div
                    ref={zoomContainerRef}
                    className={`w-full relative transition-all ${isDragOver ? 'ring-2 ring-[#8b5cf6] ring-inset bg-[#8b5cf6]/10' : ''}`}
                    style={{ height: "140px" }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onContextMenu={(e) => {
                        // Check if clicking near a boundary
                        const rect = zoomContainerRef.current?.getBoundingClientRect();
                        if (!rect || !peaksRef.current || !duration) return;

                        const view = peaksRef.current.views.getView("zoomview");
                        if (!view) return;

                        // Get visible time range and calculate click time
                        const startTime = view.getStartTime();
                        const endTime = view.getEndTime();
                        const visibleDuration = endTime - startTime;
                        const clickRatio = (e.clientX - rect.left) / rect.width;
                        const clickTime = startTime + clickRatio * visibleDuration;

                        // Find if we're near a boundary (scaled threshold based on zoom)
                        const boundaryThreshold = visibleDuration * 0.02; // 2% of visible range
                        for (let i = 0; i < phonemes.length - 1; i++) {
                            const boundaryTime = phonemes[i].end;
                            if (Math.abs(clickTime - boundaryTime) < boundaryThreshold) {
                                e.stopPropagation();
                                setSelectedBoundaryIndex(i);
                                setSelectedSegmentId(null);
                                setContextMenu({
                                    x: e.clientX,
                                    y: e.clientY,
                                    segmentId: "",
                                    type: "boundary",
                                    boundaryIndex: i,
                                });
                                return;
                            }
                        }
                    }}
                    onClick={(e) => {
                        // Check if clicking on a boundary marker
                        const rect = zoomContainerRef.current?.getBoundingClientRect();
                        if (!rect || !peaksRef.current || !duration) return;

                        const view = peaksRef.current.views.getView("zoomview");
                        if (!view) return;

                        // Get visible time range and calculate click time
                        const startTime = view.getStartTime();
                        const endTime = view.getEndTime();
                        const visibleDuration = endTime - startTime;
                        const clickRatio = (e.clientX - rect.left) / rect.width;
                        const clickTime = startTime + clickRatio * visibleDuration;

                        // Find if we're near a boundary (scaled threshold based on zoom)
                        const boundaryThreshold = visibleDuration * 0.02; // 2% of visible range
                        for (let i = 0; i < phonemes.length - 1; i++) {
                            const boundaryTime = phonemes[i].end;
                            if (Math.abs(clickTime - boundaryTime) < boundaryThreshold) {
                                e.stopPropagation();
                                setSelectedBoundaryIndex(i);
                                setSelectedSegmentId(null);
                                return;
                            }
                        }
                    }}
                />
                
                {/* Drop indicator */}
                {isDragOver && dragDropTime !== null && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="bg-[#8b5cf6]/90 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                            Drop to insert at {dragDropTime.toFixed(2)}s
                        </div>
                    </div>
                )}
            </div>

            {/* Boundary info when selected */}
            {selectedBoundaryIndex !== null && selectedBoundaryIndex < phonemes.length - 1 && (
                <div className='px-6 py-3 bg-[#2a2a2a] border-t border-[#333333]'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                            <div className='w-8 h-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center'>
                                <div className='w-0.5 h-4 bg-white' />
                            </div>
                            <div className='text-sm'>
                                <span className='text-[#6b6b6b]'>Boundary between: </span>
                                <span
                                    className='font-mono font-bold px-1.5 py-0.5 rounded text-white text-xs'
                                    style={{ backgroundColor: getSegmentColor(phonemes[selectedBoundaryIndex].value) }}
                                >
                                    {phonemes[selectedBoundaryIndex].value}
                                </span>
                                <span className='text-[#6b6b6b] mx-2'>and</span>
                                <span
                                    className='font-mono font-bold px-1.5 py-0.5 rounded text-white text-xs'
                                    style={{ backgroundColor: getSegmentColor(phonemes[selectedBoundaryIndex + 1].value) }}
                                >
                                    {phonemes[selectedBoundaryIndex + 1].value}
                                </span>
                                <span className='text-[#6b6b6b] ml-4'>at </span>
                                <span className='text-[#f5f5f5] font-mono'>{phonemes[selectedBoundaryIndex].end.toFixed(3)}s</span>
                            </div>
                        </div>
                        <button
                            onClick={() => deleteBoundary(selectedBoundaryIndex)}
                            className='btn-danger flex items-center gap-2 px-3'
                            title='Delete boundary (merge segments)'
                        >
                            <Trash2 className='w-4 h-4' />
                            Delete Boundary
                        </button>
                    </div>
                </div>
            )}

            {/* Selected segment info */}
            {selectedPhoneme && (
                <div className='px-6 py-2 bg-[#242424] border-t border-[#333333]'>
                    <div className='flex items-center gap-4'>
                        <div
                            className='w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-white text-sm'
                            style={{ backgroundColor: getSegmentColor(selectedPhoneme.value) }}
                        >
                            {selectedPhoneme.value}
                        </div>
                        <div className='text-sm'>
                            <span className='text-[#6b6b6b]'>Selected: </span>
                            <span className='text-[#f5f5f5] font-medium'>{MOUTH_SHAPE_INFO[selectedPhoneme.value].name}</span>
                            <span className='text-[#6b6b6b] ml-3'>Duration: </span>
                            <span className='text-[#f5f5f5] font-mono'>
                                {((selectedPhoneme.end - selectedPhoneme.start) * 1000).toFixed(0)}ms
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Playback and editing controls */}
            <div className='flex items-center gap-3 px-6 py-4 border-t border-[#333333]'>
                {/* Navigation */}
                <button onClick={goToPrevSegment} className='btn-ghost p-2' title='Previous segment (←)'>
                    <ChevronLeft className='w-5 h-5' />
                </button>

                <button onClick={() => seek(0)} className='btn-ghost p-2' title='Restart'>
                    <SkipBack className='w-5 h-5' />
                </button>

                <button onClick={togglePlayPause} className='btn-primary flex items-center gap-2 px-6'>
                    {isPlaying ? (
                        <>
                            <Pause className='w-4 h-4' />
                            Pause
                        </>
                    ) : (
                        <>
                            <Play className='w-4 h-4' />
                            Play
                        </>
                    )}
                </button>

                <button onClick={() => seek(duration)} className='btn-ghost p-2' title='End'>
                    <SkipForward className='w-5 h-5' />
                </button>

                <button onClick={goToNextSegment} className='btn-ghost p-2' title='Next segment (→)'>
                    <ChevronRight className='w-5 h-5' />
                </button>

                <div className='w-px h-6 bg-[#333333] mx-2' />

                {/* Editing tools */}
                <button onClick={splitAtPlayhead} className='btn-secondary flex items-center gap-2 px-3' title='Split at playhead (S)'>
                    <Scissors className='w-4 h-4' />
                    Split
                </button>

                <button
                    onClick={mergeWithNext}
                    disabled={!selectedSegmentId}
                    className='btn-secondary flex items-center gap-2 px-3 disabled:opacity-50'
                    title='Merge with next (M)'
                >
                    <Merge className='w-4 h-4' />
                    Merge
                </button>

                <button
                    onClick={deleteSelected}
                    disabled={!selectedSegmentId || phonemes.length <= 1}
                    className='btn-danger flex items-center gap-2 px-3 disabled:opacity-50'
                    title='Delete segment (Delete)'
                >
                    <Trash2 className='w-4 h-4' />
                </button>

                <div className='flex-1' />

                {/* Undo/Redo */}
                <button onClick={undo} disabled={historyIndex <= 0} className='btn-ghost p-2 disabled:opacity-30' title='Undo (⌘Z)'>
                    <Undo className='w-4 h-4' />
                </button>

                <button
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    className='btn-ghost p-2 disabled:opacity-30'
                    title='Redo (⌘⇧Z)'
                >
                    <Redo className='w-4 h-4' />
                </button>

                <div className='flex items-center gap-2 text-[#6b6b6b] ml-2'>
                    <Volume2 className='w-4 h-4' />
                </div>
            </div>

            {/* Context Menu for Segments */}
            {contextMenu &&
                contextMenu.type === "segment" &&
                (() => {
                    const index = parseInt(contextMenu.segmentId.replace("segment-", ""), 10);
                    const segment = phonemes[index];
                    if (!segment) return null;

                    return (
                        <>
                            {/* Backdrop to close menu */}
                            <div className='fixed inset-0 z-40' onClick={() => setContextMenu(null)} />

                            {/* Menu */}
                            <div
                                className='fixed z-50 bg-[#242424] border border-[#333333] rounded-lg shadow-2xl overflow-hidden min-w-[200px]'
                                style={{
                                    left: `${contextMenu.x}px`,
                                    top: `${contextMenu.y}px`,
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Segment info header */}
                                <div className='px-4 py-3 bg-[#1a1a1a] border-b border-[#333333]'>
                                    <div className='flex items-center gap-3'>
                                        <div
                                            className='w-8 h-8 rounded flex items-center justify-center font-mono font-bold text-white text-sm'
                                            style={{ backgroundColor: getSegmentColor(segment.value) }}
                                        >
                                            {segment.value}
                                        </div>
                                        <div className='text-sm'>
                                            <div className='text-[#f5f5f5] font-medium'>{MOUTH_SHAPE_INFO[segment.value].name}</div>
                                            <div className='text-[#6b6b6b] text-xs font-mono'>
                                                {((segment.end - segment.start) * 1000).toFixed(0)}ms
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className='py-1'>
                                    {/* Change shape submenu */}
                                    <div className='px-2 py-1'>
                                        <div className='text-[10px] uppercase tracking-wider text-[#6b6b6b] px-2 py-1'>Change Shape</div>
                                        <div className='grid grid-cols-3 gap-1 p-1'>
                                            {mouthShapes.map((shape) => (
                                                <button
                                                    key={shape}
                                                    onClick={() => {
                                                        const newPhonemes = [...phonemes];
                                                        newPhonemes[index] = { ...newPhonemes[index], value: shape };
                                                        addToHistory(newPhonemes, `Change to ${shape}`);
                                                        onPhonemesChange(newPhonemes);
                                                        setSelectedSegmentId(`segment-${index}`);
                                                        setContextMenu(null);
                                                    }}
                                                    className={`
                                                        w-full h-10 rounded flex flex-col items-center justify-center
                                                        font-mono font-bold text-xs transition-all
                                                        ${segment.value === shape ? "ring-2 ring-[#8b5cf6]" : "hover:scale-105"}
                                                    `}
                                                    style={{
                                                        backgroundColor: getSegmentColor(shape),
                                                        color: "white",
                                                    }}
                                                    title={MOUTH_SHAPE_INFO[shape].name}
                                                >
                                                    {shape}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className='h-px bg-[#333333] my-1' />

                                    {/* Insert shape (splits and inserts new shape) */}
                                    <div className='px-2 py-1'>
                                        <div className='text-[10px] uppercase tracking-wider text-[#6b6b6b] px-2 py-1 flex items-center gap-1'>
                                            <Plus className='w-3 h-3' />
                                            Insert Shape
                                        </div>
                                        <div className='grid grid-cols-3 gap-1 p-1'>
                                            {mouthShapes.map((shape) => (
                                                <button
                                                    key={shape}
                                                    onClick={() => {
                                                        const midTime = segment.start + (segment.end - segment.start) / 2;
                                                        insertShapeAtTime(shape, midTime);
                                                        setContextMenu(null);
                                                    }}
                                                    className='w-full h-10 rounded flex flex-col items-center justify-center font-mono font-bold text-xs transition-all hover:scale-105'
                                                    style={{
                                                        backgroundColor: getSegmentColor(shape),
                                                        color: "white",
                                                    }}
                                                    title={`Insert ${MOUTH_SHAPE_INFO[shape].name}`}
                                                >
                                                    {shape}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className='h-px bg-[#333333] my-1' />

                                    {/* Split */}
                                    <button
                                        onClick={() => {
                                            setSelectedSegmentId(contextMenu.segmentId);
                                            if (peaksRef.current) {
                                                peaksRef.current.player.seek(segment.start + (segment.end - segment.start) / 2);
                                            }
                                            setTimeout(() => splitAtPlayhead(), 50);
                                            setContextMenu(null);
                                        }}
                                        className='w-full px-4 py-2 text-left text-sm text-[#f5f5f5] hover:bg-[#2a2a2a] flex items-center gap-3 transition-colors'
                                    >
                                        <Scissors className='w-4 h-4' />
                                        Split in Half
                                    </button>

                                    {/* Merge with next */}
                                    {index < phonemes.length - 1 && (
                                        <button
                                            onClick={() => {
                                                setSelectedSegmentId(contextMenu.segmentId);
                                                mergeWithNext();
                                                setContextMenu(null);
                                            }}
                                            className='w-full px-4 py-2 text-left text-sm text-[#f5f5f5] hover:bg-[#2a2a2a] flex items-center gap-3 transition-colors'
                                        >
                                            <Merge className='w-4 h-4' />
                                            Merge with Next
                                        </button>
                                    )}

                                    <div className='h-px bg-[#333333] my-1' />

                                    {/* Delete */}
                                    <button
                                        onClick={() => deleteSegment(contextMenu.segmentId)}
                                        disabled={phonemes.length <= 1}
                                        className='w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                        <Trash2 className='w-4 h-4' />
                                        Delete Segment
                                    </button>
                                </div>
                            </div>
                        </>
                    );
                })()}

            {/* Context Menu for Boundaries */}
            {contextMenu &&
                contextMenu.type === "boundary" &&
                contextMenu.boundaryIndex !== undefined &&
                (() => {
                    const boundaryIdx = contextMenu.boundaryIndex;
                    const leftSegment = phonemes[boundaryIdx];
                    const rightSegment = phonemes[boundaryIdx + 1];
                    if (!leftSegment || !rightSegment) return null;

                    return (
                        <>
                            {/* Backdrop to close menu */}
                            <div className='fixed inset-0 z-40' onClick={() => setContextMenu(null)} />

                            {/* Menu */}
                            <div
                                className='fixed z-50 bg-[#242424] border border-[#333333] rounded-lg shadow-2xl overflow-hidden min-w-[220px]'
                                style={{
                                    left: `${contextMenu.x}px`,
                                    top: `${contextMenu.y}px`,
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Boundary info header */}
                                <div className='px-4 py-3 bg-[#1a1a1a] border-b border-[#333333]'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-8 h-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center'>
                                            <div className='w-0.5 h-4 bg-white' />
                                        </div>
                                        <div className='text-sm'>
                                            <div className='text-[#f5f5f5] font-medium'>Boundary</div>
                                            <div className='text-[#6b6b6b] text-xs font-mono'>at {leftSegment.end.toFixed(3)}s</div>
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-2 mt-2'>
                                        <span
                                            className='font-mono font-bold px-1.5 py-0.5 rounded text-white text-xs'
                                            style={{ backgroundColor: getSegmentColor(leftSegment.value) }}
                                        >
                                            {leftSegment.value}
                                        </span>
                                        <span className='text-[#6b6b6b] text-xs'>→</span>
                                        <span
                                            className='font-mono font-bold px-1.5 py-0.5 rounded text-white text-xs'
                                            style={{ backgroundColor: getSegmentColor(rightSegment.value) }}
                                        >
                                            {rightSegment.value}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className='py-1'>
                                    {/* Delete boundary (merge) */}
                                    <button
                                        onClick={() => deleteBoundary(boundaryIdx)}
                                        className='w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors'
                                    >
                                        <Trash2 className='w-4 h-4' />
                                        Delete Boundary (Merge)
                                    </button>

                                    <div className='h-px bg-[#333333] my-1' />

                                    {/* Info about what will happen */}
                                    <div className='px-4 py-2 text-xs text-[#6b6b6b]'>
                                        Merges into one{" "}
                                        <span
                                            className='font-mono font-bold px-1 rounded text-white'
                                            style={{ backgroundColor: getSegmentColor(leftSegment.value) }}
                                        >
                                            {leftSegment.value}
                                        </span>{" "}
                                        segment
                                    </div>
                                </div>
                            </div>
                        </>
                    );
                })()}
        </div>
    );
}

// Shortcut display helper
function Shortcut({ keys, action }: { keys: string[]; action: string }) {
    return (
        <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-1'>
                {keys.map((key, i) => (
                    <React.Fragment key={i}>
                        <kbd className='px-1.5 py-0.5 bg-[#333333] rounded text-[10px] font-mono text-[#a8a8a8]'>{key}</kbd>
                        {i < keys.length - 1 && keys.length > 1 && !keys[i + 1].startsWith("/") && (
                            <span className='text-[#4a4a4a]'>+</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
            <span className='text-[#6b6b6b] truncate'>{action}</span>
        </div>
    );
}
