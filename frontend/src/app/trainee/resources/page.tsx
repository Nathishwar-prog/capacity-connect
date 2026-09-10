'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import {
  Library,
  FileText,
  Video,
  Presentation,
  Download,
  ExternalLink,
  Search,
  Filter,
  Bookmark,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Eye,
  FileCode,
} from 'lucide-react';

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  resourceType: 'PDF' | 'VIDEO' | 'PRESENTATION' | 'DOCUMENT' | 'LINK';
  url: string;
  category?: string;
  fileSize?: number;
  fileName?: string;
  createdAt?: string;
  tags?: string[];
}

const CURATED_RESOURCES: ResourceItem[] = [
  {
    id: 'res-1',
    title: 'WMO Guidelines on Radar Meteorology & Signal Processing',
    description: 'Operational technical specifications for C-band and S-band polarimetric Doppler weather radar calibration and hydrometeor classification.',
    resourceType: 'PDF',
    url: 'https://library.wmo.int',
    category: 'Doppler Radar',
    fileSize: 4200000,
    fileName: 'WMO_Radar_Calibration_SOP_2025.pdf',
    createdAt: '2026-01-15T09:00:00Z',
    tags: ['Radar', 'Doppler', 'Calibration', 'WMO'],
  },
  {
    id: 'res-2',
    title: 'High-Resolution NWP Assimilation Techniques: WRF & GFS',
    description: 'In-depth guide covering 4D-Var data assimilation, convective-scale modeling, and boundary layer parameterizations for Indian sub-continent forecasts.',
    resourceType: 'PDF',
    url: 'https://moes.gov.in',
    category: 'NWP & Forecasting',
    fileSize: 8900000,
    fileName: 'MoES_NWP_Assimilation_Manual.pdf',
    createdAt: '2026-02-01T11:30:00Z',
    tags: ['NWP', 'Assimilation', 'WRF', 'GFS'],
  },
  {
    id: 'res-3',
    title: 'INSAT-3D & 3DR Multi-Spectral Satellite Imagery Interpretation',
    description: 'Video lecture series demonstrating rapid scan analysis, water vapor channel tracking, and convective cloud-top temperature estimation for severe thunderstorms.',
    resourceType: 'VIDEO',
    url: 'https://imd.gov.in',
    category: 'Satellite Meteorology',
    fileSize: 45000000,
    fileName: 'INSAT_Satellite_Analysis_Lecture.mp4',
    createdAt: '2026-02-10T14:15:00Z',
    tags: ['Satellite', 'INSAT', 'Remote Sensing'],
  },
  {
    id: 'res-4',
    title: 'Standard Operating Procedure: Tropical Cyclone Warning Operations',
    description: 'Official Cyclone Warning Division (CWD) operational SOP for Bay of Bengal and Arabian Sea depressions, deep depressions, and severe cyclonic storms.',
    resourceType: 'PDF',
    url: 'https://rsmcnewdelhi.imd.gov.in',
    category: 'Cyclone & Severe Weather',
    fileSize: 3100000,
    fileName: 'IMD_Cyclone_Warning_SOP_v4.pdf',
    createdAt: '2026-02-18T08:45:00Z',
    tags: ['Cyclone', 'Disaster Management', 'RSMC'],
  },
  {
    id: 'res-5',
    title: 'Flash Flood Guidance System (FFGS) & Hydrometeorological Telemetry',
    description: 'Technical presentation explaining catchment threshold modeling, automated rain gauge network telemetry, and urban inundation risk alerts.',
    resourceType: 'PRESENTATION',
    url: 'https://imd.gov.in',
    category: 'Hydrology & Monsoon',
    fileSize: 12400000,
    fileName: 'South_Asia_FFGS_Operational_Guide.pptx',
    createdAt: '2026-03-01T16:20:00Z',
    tags: ['Hydrology', 'Flood', 'Rain Gauge'],
  },
  {
    id: 'res-6',
    title: 'Automated Weather Station (AWS) Maintenance & Sensor Calibration Manual',
    description: 'Field engineer checklist for sonic anemometers, tipping bucket rain gauges, barometric pressure capsules, and Campbell Scientific dataloggers.',
    resourceType: 'DOCUMENT',
    url: 'https://imd.gov.in',
    category: 'SOPs & Manuals',
    fileSize: 2100000,
    fileName: 'AWS_Sensor_Calibration_Handbook.docx',
    createdAt: '2026-03-05T10:00:00Z',
    tags: ['AWS', 'Sensors', 'Instrumentation', 'Maintenance'],
  },
];

export default function TraineeResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>(CURATED_RESOURCES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activePreview, setActivePreview] = useState<ResourceItem | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(['res-1', 'res-4']));

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/resources');
      const apiData = res.data.data;
      if (Array.isArray(apiData) && apiData.length > 0) {
        // Merge API resources with curated library
        const combined = [...apiData, ...CURATED_RESOURCES.filter(c => !apiData.some((a: any) => a.id === c.id))];
        setResources(combined);
      } else {
        setResources(CURATED_RESOURCES);
      }
    } catch (err) {
      // Fallback to rich curated list
      setResources(CURATED_RESOURCES);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = [
    'ALL',
    'Doppler Radar',
    'NWP & Forecasting',
    'Satellite Meteorology',
    'Cyclone & Severe Weather',
    'Hydrology & Monsoon',
    'SOPs & Manuals',
  ];

  const types = ['ALL', 'PDF', 'VIDEO', 'PRESENTATION', 'DOCUMENT'];

  const filteredResources = resources.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesType = selectedType === 'ALL' || item.resourceType === selectedType;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesType && matchesSearch;
  });

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'VIDEO':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'PRESENTATION':
        return <Presentation className="w-4 h-4 text-amber-600" />;
      default:
        return <FileCode className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <ProtectedRoute allowedRoles={['TRAINEE', 'ADMIN', 'SUPER_ADMIN']}>
      <AppShell>
        <div className="max-w-7xl mx-auto space-y-6 pb-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                  <Library className="w-3.5 h-3.5 text-indigo-600" />
                  Official Learning Repository
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                Meteorological & Earth Sciences Resource Library
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Authorized WMO technical manuals, Doppler radar calibration protocols, and NWP operational handbooks.
              </p>
            </div>
          </div>

          {/* Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-white border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Items</span>
              <p className="text-xl font-black text-slate-900 mt-1">{resources.length}</p>
            </Card>
            <Card className="p-4 bg-white border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Technical Manuals</span>
              <p className="text-xl font-black text-indigo-600 mt-1">
                {resources.filter((r) => r.resourceType === 'PDF').length}
              </p>
            </Card>
            <Card className="p-4 bg-white border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Video Lectures</span>
              <p className="text-xl font-black text-blue-600 mt-1">
                {resources.filter((r) => r.resourceType === 'VIDEO').length}
              </p>
            </Card>
            <Card className="p-4 bg-white border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Bookmarked</span>
              <p className="text-xl font-black text-amber-600 mt-1">{bookmarkedIds.size}</p>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <Card className="p-4 bg-white border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search manuals, radar procedures, WMO standards, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs rounded-xl"
                />
              </div>

              {/* Format Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Format:
                </span>
                {types.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      selectedType === type
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Domain:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Card>

          {/* Resources Grid */}
          {filteredResources.length === 0 ? (
            <Card className="p-12 text-center text-slate-500 text-xs">
              No learning resources match your current filter criteria.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((item) => {
                const isBookmarked = bookmarkedIds.has(item.id);
                return (
                  <Card
                    key={item.id}
                    className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200 bg-white rounded-2xl group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                          {getTypeIcon(item.resourceType)}
                          <span>{item.resourceType}</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {item.category && (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {item.category}
                            </span>
                          )}
                          <button
                            onClick={() => toggleBookmark(item.id)}
                            className={`p-1 rounded-md transition-colors ${
                              isBookmarked
                                ? 'text-amber-500 bg-amber-50'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title="Bookmark resource"
                          >
                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-3 mt-1.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatSize(item.fileSize)}
                      </span>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActivePreview(item)}
                          className="h-8 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          <span>Preview</span>
                        </Button>

                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Preview Modal */}
          {activePreview && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {activePreview.category || 'General Meteorology'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {activePreview.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActivePreview(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-xs text-slate-600">
                  <p className="leading-relaxed">{activePreview.description}</p>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400 font-semibold">Document Format:</span>
                      <span className="font-bold text-slate-800">{activePreview.resourceType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-400 font-semibold">File Name:</span>
                      <span className="font-bold text-slate-800 font-mono text-[11px]">
                        {activePreview.fileName || 'document.pdf'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 font-semibold">Estimated File Size:</span>
                      <span className="font-bold text-slate-800">{formatSize(activePreview.fileSize)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActivePreview(null)}
                    className="text-xs"
                  >
                    Close
                  </Button>
                  <a
                    href={activePreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Access Official Resource</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
