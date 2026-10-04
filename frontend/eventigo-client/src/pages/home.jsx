import React, { useState, useEffect } from 'react';
import api from '../utils/axios';

import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaSearch,
  FaRegClock,
  FaTicketAlt,
  FaShieldAlt,
} from 'react-icons/fa';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvents();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // =========================================
  // FETCH EVENTS
  // =========================================

  const fetchEvents = async () => {
    try {
      setLoading(true);

      const response = await api.get('/event', {
        params: search.trim()
          ? { search: search.trim() }
          : {},
      });

      const data = response.data;

      const fetchedEvents = Array.isArray(data)
        ? data
        : Array.isArray(data?.events)
          ? data.events
          : [];

      setEvents(fetchedEvents);
    } catch (error) {
      console.error(
        'ERROR FETCHING EVENTS:',
        error?.response?.data || error.message
      );

      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">

      {/* =========================================
          HERO SECTION
      ========================================= */}

      <div className="relative mb-12 overflow-hidden rounded-3xl bg-indigo-50 text-gray-900 shadow-xl">

        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')",
          }}
        />

        {/* Light overlay */}

        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/95 via-white/90 to-purple-100/90" />

        <div className="relative z-10 flex flex-col items-center p-10 text-center md:p-20">

          {/* Badge */}

          <span className="mb-6 rounded-full border border-indigo-200 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-700 shadow-sm backdrop-blur-md">
            Welcome to Eventigo
          </span>

          {/* Heading */}

          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight md:text-7xl">

            Find Your Next
            <br />

            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Unforgettable
            </span>

            {' '}Experience

          </h1>

          {/* Description */}

          <p className="mx-auto mb-10 max-w-2xl text-lg font-medium leading-relaxed text-gray-600 md:text-xl">
            Discover the best tech conferences, late-night music festivals,
            and hands-on workshops happening directly in your area.
            Secure your spot today.
          </p>

          {/* Search */}

          <div className="group relative mx-auto w-full max-w-2xl">

            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-xl text-gray-400 transition-colors group-focus-within:text-indigo-600" />

            <input
              type="text"
              placeholder="Search events by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border-2 border-white bg-white py-5 pl-16 pr-6 text-lg font-medium text-gray-900 shadow-xl transition-all placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            />

          </div>

        </div>
      </div>

      {/* =========================================
          WHY CHOOSE US
      ========================================= */}

      <div className="mb-16 grid grid-cols-1 gap-8 px-4 md:grid-cols-3">

        {/* Fast Booking */}

        <div className="group flex flex-col items-center rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg">

          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-2xl text-indigo-600 shadow-sm transition group-hover:bg-indigo-600 group-hover:text-white">
            <FaRegClock />
          </div>

          <h3 className="mb-3 text-xl font-bold text-gray-900">
            Fast Booking
          </h3>

          <p className="text-sm leading-relaxed text-gray-500">
            Secure your tickets instantly with our fast streamlined booking
            infrastructure built for speed.
          </p>

        </div>

        {/* Seamless Access */}

        <div className="group flex flex-col items-center rounded-2xl border border-purple-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-lg">

          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-2xl text-purple-600 shadow-sm transition group-hover:bg-purple-600 group-hover:text-white">
            <FaTicketAlt />
          </div>

          <h3 className="mb-3 text-xl font-bold text-gray-900">
            Seamless Access
          </h3>

          <p className="text-sm leading-relaxed text-gray-500">
            Download tickets instantly or manage them right from your
            personal dashboard with ease.
          </p>

        </div>

        {/* Secure Platform */}

        <div className="group flex flex-col items-center rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">

          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
            <FaShieldAlt />
          </div>

          <h3 className="mb-3 text-xl font-bold text-gray-900">
            Secure Platform
          </h3>

          <p className="text-sm leading-relaxed text-gray-500">
            All transactions and registrations are protected by
            cutting-edge security and 2FA OTP technology.
          </p>

        </div>

      </div>

      {/* =========================================
          UPCOMING EVENTS HEADER
      ========================================= */}

      <div className="mb-8 flex items-center justify-between border-b border-gray-200 px-2 pb-4">

        <h2 className="text-3xl font-extrabold text-gray-900">
          Upcoming Events
        </h2>

        <div className="font-medium text-gray-500">
          {events.length} results found
        </div>

      </div>

      {/* =========================================
          LOADING
      ========================================= */}

      {loading && (
        <div className="py-20 text-center text-xl font-semibold text-gray-600">
          Loading events...
        </div>
      )}

      {/* =========================================
          NO EVENTS
      ========================================= */}

      {!loading && events.length === 0 && (
        <div className="py-20 text-center">

          <div className="mb-4 text-5xl">
            🎫
          </div>

          <h3 className="text-2xl font-bold text-gray-800">
            No events found
          </h3>

          <p className="mt-2 text-gray-500">
            No events are currently available.
          </p>

        </div>
      )}

      {/* =========================================
          EVENT CARDS
      ========================================= */}

      {!loading && events.length > 0 && (

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">

          {events.map((event) => {

            const eventId = event._id;

            const image =
              event.image ||
              event.imageUrl ||
              event.eventImage ||
              event.poster ||
              event.banner ||
              'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80';

            const seatsPercentage =
              event.totalSeats > 0
                ? (event.availableSeats / event.totalSeats) * 100
                : 0;

            return (

              <div
                key={eventId}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-indigo-100 hover:shadow-xl"
              >

                {/* EVENT IMAGE */}

                <div className="relative h-64 overflow-hidden bg-gray-100">

                  <img
                    src={image}
                    alt={event.title || 'Event'}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80';
                    }}
                  />

                  {/* Softer Gradient */}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

                  {/* Category */}

                  {event.category && (
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm backdrop-blur-sm">
                      {event.category}
                    </span>
                  )}

                  {/* Price */}

                  <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-sm font-bold shadow-sm backdrop-blur-sm">

                    {event.ticketPrice === 0 ? (
                      <span className="text-green-600">
                        FREE
                      </span>
                    ) : (
                      <span className="text-gray-900">
                        ₹{event.ticketPrice}
                      </span>
                    )}

                  </div>

                  {/* Location */}

                  {event.location && (
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm font-medium text-white">

                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600/90">
                        <FaMapMarkerAlt />
                      </span>

                      <span className="drop-shadow-md">
                        {typeof event.location === 'object'
                          ? event.location.name ||
                            event.location.address ||
                            event.location.city ||
                            'Location available'
                          : event.location}
                      </span>

                    </div>
                  )}

                </div>

                {/* EVENT CONTENT */}

                <div className="flex flex-grow flex-col p-6">

                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
                    {event.category || 'Event'}
                  </div>

                  <h2 className="mb-3 text-xl font-bold text-gray-900">
                    {event.title || 'Untitled Event'}
                  </h2>

                  {event.description && (
                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-500">
                      {event.description}
                    </p>
                  )}

                  {/* Date */}

                  <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">

                    <FaCalendarAlt className="text-indigo-400" />

                    <span>
                      {event.date
                        ? new Date(event.date).toLocaleDateString(
                            'en-IN',
                            {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )
                        : 'Date not available'}
                    </span>

                  </div>

                  {/* Location */}

                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">

                    <FaMapMarkerAlt className="text-indigo-400" />

                    <span>
                      {typeof event.location === 'object'
                        ? event.location.name ||
                          event.location.address ||
                          event.location.city ||
                          'Location available'
                        : event.location || 'Location not available'}
                    </span>

                  </div>

                  {/* Seats */}

                  <div className="mt-auto">

                    <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">

                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, seatsPercentage)
                          )}%`,
                        }}
                      />

                    </div>

                    <p className="mb-4 text-xs text-gray-500">

                      {event.availableSeats ?? 0} of{' '}
                      {event.totalSeats ?? 0} seats remaining

                    </p>

                    {/* View Details */}

                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/events/${eventId}`;
                      }}
                      className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-sm transition-all duration-300 hover:bg-indigo-700 hover:shadow-lg"
                    >
                      View Details
                    </button>

                  </div>

                </div>

              </div>

            );
          })}

        </div>

      )}

      {/* =========================================
          FOOTER
      ========================================= */}

      <footer className="mt-16 border-t border-gray-200 bg-white pb-8 pt-16 text-center">

        <div className="mb-4 flex items-center justify-center gap-2">

          <FaTicketAlt className="text-2xl text-indigo-600" />

          <span className="text-xl font-bold text-gray-900">
            Eventigo
          </span>

        </div>

        <p className="mx-auto mb-6 max-w-md text-sm text-gray-500">
          The simplest, most dynamic way to discover, manage,
          and experience amazing events in your city.
        </p>

        <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
          © {new Date().getFullYear()} Eventigo Platform.
          All rights reserved.
        </div>

      </footer>

    </div>
  );
};

export default Home;