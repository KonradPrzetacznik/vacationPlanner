/**
 * Calendar component
 * Displays team vacation calendar using FullCalendar library
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventContentArg } from "@fullcalendar/core";
import type { VacationRequestViewModel } from "@/types";
import { VacationDetailsTooltip } from "./VacationDetailsTooltip";
import plLocale from "@fullcalendar/core/locales/pl";


interface CalendarProps {
  vacations: VacationRequestViewModel[];
  onDateRangeChange: (startDate: string, endDate: string) => void;
  isLoading: boolean;
  onEventClick?: (vacation: VacationRequestViewModel) => void;
  initialDate?: string; // ISO date to initialize calendar view
}

// Status color mapping for calendar events
const statusColors = {
  SUBMITTED: "#eab308", // yellow-500
  APPROVED: "#22c55e", // green-500
  REJECTED: "#ef4444", // red-500
  CANCELLED: "#6b7280", // gray-500
};

export const Calendar: React.FC<CalendarProps> = ({ vacations, onDateRangeChange, isLoading, onEventClick, initialDate }) => {
  const [tooltip, setTooltip] = useState<{
    vacation: VacationRequestViewModel;
    position: { x: number; y: number };
  } | null>(null);
  const [calendarTitle, setCalendarTitle] = useState<string>("");

  const calendarRef = useRef<FullCalendar>(null);

  // Update calendar title when calendar is ready or when initialDate changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      setCalendarTitle(calendarApi.view.title);
    }
  }, [initialDate]);

  // Filter vacations to show only SUBMITTED and APPROVED in calendar
  // REJECTED and CANCELLED will be visible only in the list below calendar
  const visibleVacations = vacations.filter(
    (vacation) => vacation.status === "SUBMITTED" || vacation.status === "APPROVED"
  );

  // Transform vacation data to FullCalendar events
  const events: EventInput[] = visibleVacations.map((vacation) => ({
    id: vacation.id,
    title: `${vacation.user.firstName} ${vacation.user.lastName}`,
    start: vacation.startDate,
    end: new Date(new Date(vacation.endDate).getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Add 1 day for exclusive end date
    backgroundColor: statusColors[vacation.status],
    borderColor: statusColors[vacation.status],
    extendedProps: {
      vacation,
    },
  }));

  // Handle custom navigation buttons
  const handlePrevMonth = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi || isLoading) return;

    calendarApi.prev();

    // Update title
    setCalendarTitle(calendarApi.view.title);

    // Get new date range after navigation
    const view = calendarApi.view;
    const startDate = view.currentStart.toISOString().split("T")[0];
    const endDate = new Date(view.currentEnd.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    console.log("[Calendar] Prev month:", { startDate, endDate });
    onDateRangeChange(startDate, endDate);
  }, [onDateRangeChange, isLoading]);

  const handleNextMonth = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi || isLoading) return;

    calendarApi.next();

    // Update title
    setCalendarTitle(calendarApi.view.title);

    // Get new date range after navigation
    const view = calendarApi.view;
    const startDate = view.currentStart.toISOString().split("T")[0];
    const endDate = new Date(view.currentEnd.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    console.log("[Calendar] Next month:", { startDate, endDate });
    onDateRangeChange(startDate, endDate);
  }, [onDateRangeChange, isLoading]);

  const handleToday = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi || isLoading) return;

    calendarApi.today();

    // Update title
    setCalendarTitle(calendarApi.view.title);

    // Get new date range after navigation
    const view = calendarApi.view;
    const startDate = view.currentStart.toISOString().split("T")[0];
    const endDate = new Date(view.currentEnd.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    console.log("[Calendar] Today:", { startDate, endDate });
    onDateRangeChange(startDate, endDate);
  }, [onDateRangeChange, isLoading]);

  // Handle event click
  const handleEventClick = useCallback((clickInfo: any) => {
    if (onEventClick) {
      const vacation = clickInfo.event.extendedProps.vacation as VacationRequestViewModel;
      onEventClick(vacation);
    }
  }, [onEventClick]);

  // Handle mouse enter on event
  const handleEventMouseEnter = useCallback((event: MouseEvent, vacation: VacationRequestViewModel) => {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    setTooltip({
      vacation,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      },
    });
  }, []);

  // Handle mouse leave from event
  const handleEventMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  // Custom event content renderer
  const renderEventContent = (eventInfo: EventContentArg) => {
    const vacation = eventInfo.event.extendedProps.vacation as VacationRequestViewModel;

    return (
      <div
        className="fc-event-main-frame cursor-pointer"
        onMouseEnter={(e) => handleEventMouseEnter(e.nativeEvent, vacation)}
        onMouseLeave={handleEventMouseLeave}
      >
        <div className="fc-event-title-container">
          <div className="fc-event-title fc-sticky text-xs px-1 py-0.5 truncate">
            {eventInfo.event.title}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      {/* Custom navigation buttons */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            disabled={isLoading}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Poprzedni
          </button>
          <button
            onClick={handleToday}
            disabled={isLoading}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Dzisiaj
          </button>
          <button
            onClick={handleNextMonth}
            disabled={isLoading}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Następny →
          </button>
        </div>
        <h2 className="text-xl font-semibold">
          {calendarTitle}
        </h2>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        locale={plLocale}
        headerToolbar={false}
        height="auto"
        events={events}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        eventDisplay="block"
        dayMaxEvents={3}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        }}
        firstDay={1} // Monday
        weekends={true}
      />

      {tooltip && (
        <VacationDetailsTooltip
          vacation={tooltip.vacation}
          position={tooltip.position}
        />
      )}

      <style>{`
        .calendar-container {
          background: white;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--border));
          padding: 1rem;
        }
        
        .fc {
          font-family: inherit;
        }
        
        .fc-theme-standard .fc-scrollgrid {
          border-color: hsl(var(--border));
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: hsl(var(--border));
        }
        
        .fc .fc-button-primary {
          background-color: hsl(var(--primary));
          border-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }
        
        .fc .fc-button-primary:hover {
          background-color: hsl(var(--primary) / 0.9);
          border-color: hsl(var(--primary) / 0.9);
        }
        
        .fc .fc-button-primary:disabled {
          background-color: hsl(var(--primary) / 0.5);
          border-color: hsl(var(--primary) / 0.5);
          opacity: 0.5;
        }
        
        .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        
        .fc .fc-daygrid-day-number {
          color: hsl(var(--foreground));
          padding: 0.5rem;
        }
        
        .fc .fc-col-header-cell-cushion {
          color: hsl(var(--muted-foreground));
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 0.5rem;
        }
        
        .fc .fc-event {
          cursor: pointer;
          border-radius: 0.25rem;
          margin: 1px;
          font-size: 0.75rem;
        }
        
        .fc .fc-event:hover {
          opacity: 0.85;
        }
        
        .fc .fc-daygrid-day-top {
          justify-content: center;
        }
        
        .fc .fc-day-today {
          background-color: hsl(var(--accent) / 0.2) !important;
        }
        
        .fc .fc-day-other {
          background-color: hsl(var(--muted) / 0.3);
        }
      `}</style>
    </div>
  );
};
