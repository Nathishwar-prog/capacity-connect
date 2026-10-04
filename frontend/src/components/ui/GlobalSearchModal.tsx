import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Users,
  BookOpen,
  Award,
  ClipboardList,
  Library,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Users' | 'Courses' | 'Competencies' | 'Assessments' | 'Resources' | 'Actions';
  href: string;
}

const STATIC_SEARCH_ITEMS: SearchItem[] = [
  // Institutional Actions
  {
    id: 'act-1',
    title: 'Open User Directory',
    subtitle: 'Manage personnel, roles, and status',
    category: 'Actions',
    href: '/users',
  },
  {
    id: 'act-2',
    title: 'Governance Dashboard',
    subtitle: 'Capacity development overview & command center',
    category: 'Actions',
    href: '/dashboard/admin',
  },
  {
    id: 'act-3',
    title: 'View Audit Logs',
    subtitle: 'Administrative platform security and event logs',
    category: 'Actions',
    href: '/admin/audit-logs',
  },
  {
    id: 'act-4',
    title: 'Curriculum & Courses Management',
    subtitle: 'Review, approve and publish training courses',
    category: 'Actions',
    href: '/admin/courses',
  },
  {
    id: 'act-5',
    title: 'Competency Framework',
    subtitle: 'Inspect atmospheric and ocean competency models',
    category: 'Actions',
    href: '/admin/competencies',
  },
  {
    id: 'act-6',
    title: 'Analytics Command Center',
    subtitle: 'Evaluate training participation and learning intelligence',
    category: 'Actions',
    href: '/admin/analytics',
  },
  {
    id: 'act-7',
    title: 'AI Insights & Executive Analyst',
    subtitle: 'Interactive database query assistant & visual intelligence',
    category: 'Actions',
    href: '/admin/analytics?askAi=true',
  },
  // Courses
  {
    id: 'crs-1',
    title: 'Operational Weather Forecasting & Synoptic Analysis',
    subtitle: 'Synoptic Meteorology • Intermediate',
    category: 'Courses',
    href: '/admin/courses',
  },
  {
    id: 'crs-2',
    title: 'Numerical Weather Prediction (NWP): Modeling & Operational Forecasting',
    subtitle: 'Atmospheric Modeling • Advanced',
    category: 'Courses',
    href: '/admin/courses',
  },
  {
    id: 'crs-3',
    title: 'Doppler Weather Radar (DWR) Operations & Convective Nowcasting',
    subtitle: 'Radar Meteorology • Intermediate',
    category: 'Courses',
    href: '/admin/courses',
  },
  {
    id: 'crs-4',
    title: 'Satellite Meteorology: INSAT-3D/3DR & Remote Sensing Applications',
    subtitle: 'Satellite Meteorology • Beginner',
    category: 'Courses',
    href: '/admin/courses',
  },
  {
    id: 'crs-5',
    title: 'Climate Data Analysis & Climate Change Projections',
    subtitle: 'Climate Science • Advanced',
    category: 'Courses',
    href: '/admin/courses',
  },
  {
    id: 'crs-6',
    title: 'Ocean State Forecasting & Tsunami Early Warning Systems',
    subtitle: 'Ocean Sciences • Intermediate',
    category: 'Courses',
    href: '/admin/courses',
  },
  // Competencies
  {
    id: 'cmp-1',
    title: 'Synoptic Meteorology & Weather Forecasting',
    subtitle: 'COMP-SYNOPTIC-MET • Meteorology',
    category: 'Competencies',
    href: '/admin/competencies',
  },
  {
    id: 'cmp-2',
    title: 'Numerical Weather Prediction & Modeling',
    subtitle: 'COMP-NWP-MODELING • Atmospheric Sciences',
    category: 'Competencies',
    href: '/admin/competencies',
  },
  {
    id: 'cmp-3',
    title: 'Radar Meteorology & DWR Operations',
    subtitle: 'COMP-RADAR-MET • Observational Systems',
    category: 'Competencies',
    href: '/admin/competencies',
  },
  {
    id: 'cmp-4',
    title: 'Satellite Meteorology & Remote Sensing',
    subtitle: 'COMP-SAT-MET • Remote Sensing',
    category: 'Competencies',
    href: '/admin/competencies',
  },
  // Users
  {
    id: 'usr-1',
    title: 'Dr. M. Mohapatra',
    subtitle: 'Administrator • admin@enterprise.com • MoES / IMD',
    category: 'Users',
    href: '/users?search=Mohapatra',
  },
  {
    id: 'usr-2',
    title: 'Dr. E. N. Rajagopal',
    subtitle: 'Trainer • dr.rajagopal.trainer@imd.gov.in • IMD',
    category: 'Users',
    href: '/users?search=Rajagopal',
  },
  {
    id: 'usr-3',
    title: 'Kavita Nair',
    subtitle: 'Trainee • kavita.n@imd.gov.in • Hydrology Division',
    category: 'Users',
    href: '/users?search=Kavita',
  },
  {
    id: 'usr-4',
    title: 'Subhashree Patnaik',
    subtitle: 'Trainee • subhashree.p@imd.gov.in • Climate Research (IMD Pune)',
    category: 'Users',
    href: '/users?search=Subhashree',
  },
  {
    id: 'usr-5',
    title: 'Gowri Sankar',
    subtitle: 'Trainee • gowri.s@incois.gov.in • INCOIS',
    category: 'Users',
    href: '/users?search=Gowri',
  },
];

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Close on Escape & support arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return STATIC_SEARCH_ITEMS.slice(0, 10);
    }
    const lower = query.toLowerCase();
    return STATIC_SEARCH_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.subtitle.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map: Record<string, SearchItem[]> = {};
    for (const item of filteredItems) {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    }
    return map;
  }, [filteredItems]);

  const handleSelect = (item: SearchItem) => {
    onClose();
    router.push(item.href);
  };

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Users':
        return <Users className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Courses':
        return <BookOpen className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Competencies':
        return <Award className="w-3.5 h-3.5 text-purple-600" />;
      case 'Assessments':
        return <ClipboardList className="w-3.5 h-3.5 text-amber-600" />;
      case 'Resources':
        return <Library className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <Shield className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Capacity Connect"
        className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, courses, competencies, trainers, audit logs..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No matching institutional records found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <div className="truncate pr-3">
                        <span className="block text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </span>
                        <span className="block text-[11px] text-slate-500 truncate font-medium">
                          {item.subtitle}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Capacity Connect Institutional Search</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px]">
                ↵
              </kbd>{' '}
              to select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
