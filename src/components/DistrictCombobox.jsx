import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, MapPin, Check, X } from 'lucide-react';
import { INITIAL_DISTRICTS } from '../data/initialData';

export default function DistrictCombobox({
  value = '',
  onChange,
  districts = [],
  placeholder = 'Buscar o escribir distrito...',
  className = '',
  style = {},
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Lista unificada de distritos con fallback a la lista maestra de Lima
  const allDistricts = useMemo(() => {
    const list = Array.isArray(districts) && districts.length > 0 ? districts : INITIAL_DISTRICTS;
    const set = new Set([...list, ...INITIAL_DISTRICTS]);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [districts]);

  // Sincronizar el texto del input cuando el valor cambie externamente
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Cerrar al hacer clic fuera del combobox
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar distritos según lo que escribe el usuario
  const filteredDistricts = useMemo(() => {
    if (!searchTerm.trim()) return allDistricts;
    const term = searchTerm.toLowerCase().trim();
    return allDistricts.filter(d => d.toLowerCase().includes(term));
  }, [allDistricts, searchTerm]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setSearchTerm(text);
    if (!isOpen) setIsOpen(true);
    if (onChange) {
      onChange(text);
    }
  };

  const handleSelectDistrict = (district) => {
    setSearchTerm(district);
    setIsOpen(false);
    if (onChange) {
      onChange(district);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchTerm('');
    if (onChange) {
      onChange('');
    }
    inputRef.current?.focus();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      inputRef.current?.focus();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`district-combobox-container ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <div 
        style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center',
          width: '100%' 
        }}
      >
        <MapPin 
          size={15} 
          style={{ 
            position: 'absolute', 
            left: '10px', 
            color: 'var(--text-muted)', 
            pointerEvents: 'none',
            zIndex: 1 
          }} 
        />

        <input
          ref={inputRef}
          type="text"
          className="form-control"
          style={{
            paddingLeft: '32px',
            paddingRight: searchTerm ? '52px' : '30px',
            width: '100%'
          }}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          required={required}
        />

        <div 
          style={{ 
            position: 'absolute', 
            right: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '2px' 
          }}
        >
          {searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Borrar distrito"
            >
              <X size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={toggleDropdown}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Ver lista de distritos"
          >
            <ChevronDown 
              size={15} 
              style={{ 
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease' 
              }} 
            />
          </button>
        </div>
      </div>

      {/* Menú Desplegable con Filtro en Tiempo Real */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
            borderRadius: 'var(--radius-md, 8px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 1050,
            padding: '4px'
          }}
        >
          {filteredDistricts.length === 0 ? (
            <div 
              style={{ 
                padding: '10px 12px', 
                fontSize: '0.82rem', 
                color: 'var(--text-muted)', 
                textAlign: 'center' 
              }}
            >
              Presiona Enter o continúa para usar <strong>"{searchTerm}"</strong>
            </div>
          ) : (
            filteredDistricts.map(district => {
              const isSelected = district.toLowerCase() === (value || '').toLowerCase();
              return (
                <div
                  key={district}
                  onClick={() => handleSelectDistrict(district)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm, 6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                    color: isSelected ? 'var(--primary-400, #60a5fa)' : 'var(--text-main, #f8fafc)',
                    fontWeight: isSelected ? 700 : 500
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--bg-input, rgba(255, 255, 255, 0.06))';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{district}</span>
                  {isSelected && <Check size={14} color="#60a5fa" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
