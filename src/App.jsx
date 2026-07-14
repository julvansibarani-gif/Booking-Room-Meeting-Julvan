import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function MeetingBooking() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [form, setForm] = useState({
    name: '',
    location: 'Head Office Jakarta',
    room: 'Room Cendana',
    type: 'Internal',
    date: '',
    start_time: '08:00',
    end_time: '09:00',
    link: '',
    topic: '',
  });

  const isOnline = form.room === 'Zoom App' || form.room === 'GMeet';

  // ======================
  // LIST JAM 08:00 - 17:00
  // ======================

  const times = [];

  for (let h = 8; h <= 17; h++) {
    const hour = h.toString().padStart(2, '0');

    times.push(hour + ':00');

    if (h !== 17) {
      times.push(hour + ':30');
    }
  }

  // ======================
  // LOAD BOOKING
  // ======================

  useEffect(() => {
    loadBookings();
  }, [user]);

  async function loadBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', {
        ascending: true,
      });

    if (error) {
      console.log(error);
    } else {
      setBookings(data);
    }
  }

  // ======================
  // STATUS MEETING
  // ======================

  function getMeetingStatus(date, start, end) {
    const now = new Date();

    const today = now.toISOString().split('T')[0];

    const current =
      now.getHours().toString().padStart(2, '0') +
      ':' +
      now.getMinutes().toString().padStart(2, '0');

    if (date < today) {
      return 'past';
    }

    if (date === today) {
      if (current > end) {
        return 'past';
      }

      if (current >= start && current <= end) {
        return 'live';
      }
    }

    return 'upcoming';
  }

  // ======================
  // LOGIN
  // ======================

  async function handleLogin() {
    if (!loginForm.email || !loginForm.password) {
      alert('Email dan password wajib diisi');
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setUser(data.user);
  }

  // ======================
  // SIMPAN BOOKING
  // ======================

  async function addBooking() {
    if (!form.name || !form.topic || !form.date) {
      alert('Nama, tanggal dan topik wajib diisi');

      return;
    }

    if (form.end_time <= form.start_time) {
      alert('Jam selesai harus lebih besar dari jam mulai');

      return;
    }

    // cek bentrok

    const { data: existing, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('location', form.location)
      .eq('room', form.room)
      .eq('date', form.date);

    if (error) {
      alert(error.message);
      return;
    }

    const conflict = existing.some((b) => {
      return form.start_time < b.end_time && form.end_time > b.start_time;
    });

    if (conflict) {
      alert('⚠️ Ruangan sudah dibooking karyawan lain pada waktu tersebut!');

      return;
    }

    const { error: insertError } = await supabase.from('bookings').insert([
      {
        name: form.name,
        location: form.location,
        room: form.room,
        type: form.type,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        link: isOnline ? form.link : '',
        topic: form.topic,
      },
    ]);

    if (insertError) {
      console.log(insertError);
      alert(insertError.message);
    } else {
      alert('✅ Booking berhasil disimpan');

      setForm({
        ...form,
        name: '',
        topic: '',
        link: '',
      });

      loadBookings();

      setView('dashboard');
    }
  }
  // ======================
  // LOGIN SCREEN
  // ======================

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-5">Login Karyawan</h1>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Email"
          value={loginForm.email}
          onChange={(e) =>
            setLoginForm({
              ...loginForm,
              email: e.target.value,
            })
          }
        />

        <input
          type="password"
          className="border p-2 w-full mb-3"
          placeholder="Password"
          onChange={(e) =>
            setLoginForm({
              ...loginForm,
              password: e.target.value,
            })
          }
        />

        <button
          onClick={handleLogin}
          className="bg-blue-600 text-white p-3 w-full rounded"
        >
          Masuk
        </button>
      </div>
    );
  }

  // ======================
  // MAIN APP
  // ======================

  return (
    <div className="max-w-3xl mx-auto p-5 bg-gray-100 min-h-screen">
      <div className="bg-white p-4 rounded shadow mb-5 flex justify-between">
        <b>Halo, {user.email}</b>

        <button
  className="text-red-500"
  onClick={handleLogout}
>
  Logout
</button>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setView('dashboard')}
          className="bg-blue-600 text-white flex-1 p-2 rounded"
        >
          Dashboard
        </button>

        <button
          onClick={() => setView('form')}
          className="bg-green-600 text-white flex-1 p-2 rounded"
        >
          Buat Booking
        </button>
      </div>

      {view === 'form' ? (
        <div className="bg-white p-5 rounded shadow">
          <input
            className="border p-2 w-full mb-3"
            placeholder="Nama Pemesan"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
          />

          <input
            className="border p-2 w-full mb-3"
            placeholder="Topik Meeting"
            value={form.topic}
            onChange={(e) =>
              setForm({
                ...form,
                topic: e.target.value,
              })
            }
          />

          <input
            type="date"
            className="border p-2 w-full mb-3"
            value={form.date}
            onChange={(e) =>
              setForm({
                ...form,
                date: e.target.value,
              })
            }
          />

          <select
            className="border p-2 w-full mb-3"
            value={form.location}
            onChange={(e) =>
              setForm({
                ...form,
                location: e.target.value,
              })
            }
          >
            <option>Head Office Jakarta</option>

            <option>Kantor Regional Medan</option>

            <option>Kantor Regional Kalimantan</option>
          </select>

          <select
            className="border p-2 w-full mb-3"
            value={form.room}
            onChange={(e) =>
              setForm({
                ...form,
                room: e.target.value,
              })
            }
          >
            <option>Room Cendana</option>

            <option>Room Melati</option>

            <option>Room VIP</option>

            <option>Zoom App</option>

            <option>GMeet</option>
          </select>

          <label className="font-bold">Jam Mulai</label>

          <select
            className="border p-2 w-full mb-3"
            value={form.start_time}
            onChange={(e) =>
              setForm({
                ...form,
                start_time: e.target.value,
              })
            }
          >
            {times.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          <label className="font-bold">Jam Selesai</label>

          <select
            className="border p-2 w-full mb-3"
            value={form.end_time}
            onChange={(e) =>
              setForm({
                ...form,
                end_time: e.target.value,
              })
            }
          >
            {times.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          {isOnline && (
            <input
              className="border p-2 w-full mb-3"
              placeholder="Link Meeting"
              value={form.link}
              onChange={(e) =>
                setForm({
                  ...form,
                  link: e.target.value,
                })
              }
            />
          )}

          <select
            className="border p-2 w-full mb-3"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value,
              })
            }
          >
            <option>Internal</option>

            <option>External</option>
          </select>

          <button
            onClick={addBooking}
            className="bg-blue-600 text-white w-full p-3 rounded"
          >
            Simpan Booking
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">Dashboard Meeting</h2>

          {bookings.length === 0 ? (
            <p>Belum ada booking</p>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className={`
                p-4 mb-3 rounded shadow border-l-8

                ${
                  getMeetingStatus(b.date, b.start_time, b.end_time) === 'past'
                    ? 'bg-gray-300 opacity-50 grayscale border-gray-500'
                    : getMeetingStatus(b.date, b.start_time, b.end_time) ===
                      'live'
                    ? 'bg-white border-red-500'
                    : 'bg-white border-green-500'
                }

                `}
              >
                {getMeetingStatus(b.date, b.start_time, b.end_time) ===
                  'live' && (
                  <span
                    className="
                    float-right
                    bg-red-500
                    text-white
                    text-xs
                    px-2
                    py-1
                    rounded
                    animate-pulse
                    "
                  >
                    LIVE
                  </span>
                )}

                <h3 className="font-bold">{b.topic}</h3>

                <p>
                  {b.location} | {b.room}
                </p>

                <p>{b.date}</p>

                <p>
                  {b.start_time} - {b.end_time}
                </p>

                <p className="text-sm">Pemesan: {b.name}</p>

                <p className="text-sm">Jenis: {b.type}</p>

                {b.link && (
                  <a
                    href={b.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 underline"
                  >
                    Link Meeting
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
