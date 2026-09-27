import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { TaskStatus, TaskPriority } from '../../types';
import { Filter, Search, RotateCcw } from 'lucide-react';

export const TaskFilterBar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const search = searchParams.get('search') || '';
  const dueFrom = searchParams.get('dueFrom') || '';
  const dueTo = searchParams.get('dueTo') || '';

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
          <Filter size={16} /> Filters:
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            className="form-input"
            style={{ paddingLeft: '30px' }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => updateParam('status', e.target.value)}
          className="form-select"
          style={{ width: 'auto' }}
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="DONE">Done</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priority}
          onChange={(e) => updateParam('priority', e.target.value)}
          className="form-select"
          style={{ width: 'auto' }}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>

        {/* Date Range Filters */}
        <input
          type="date"
          value={dueFrom}
          onChange={(e) => updateParam('dueFrom', e.target.value)}
          className="form-input"
          style={{ width: 'auto' }}
          title="Due From"
        />
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>to</span>
        <input
          type="date"
          value={dueTo}
          onChange={(e) => updateParam('dueTo', e.target.value)}
          className="form-input"
          style={{ width: 'auto' }}
          title="Due To"
        />
      </div>

      {(status || priority || search || dueFrom || dueTo) && (
        <button onClick={clearFilters} className="btn btn-secondary btn-sm">
          <RotateCcw size={14} /> Clear Filters
        </button>
      )}
    </div>
  );
};
