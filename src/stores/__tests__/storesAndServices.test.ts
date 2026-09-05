import { describe, it, expect, beforeEach } from "vitest";

import { useAdminMetricsStore } from "../adminMetricsStore";
import {
  useAppointmentStore,
  selectFilteredAppointments,
  selectTodayAppointments,
  selectUpcomingAppointments,
  Appointment,
} from "../appointmentStore";
import { useNotificationStore, selectEphemeralCount } from "../notificationStore";

describe("Zustand State Stores & Core Services", () => {
  describe("Admin Metrics Store", () => {
    beforeEach(() => {
      useAdminMetricsStore.getState().reset();
    });

    it("should initialize with default state", () => {
      const state = useAdminMetricsStore.getState();
      expect(state.liveViewEnabled).toBe(false);
      expect(state.connectionStatus).toBe("disconnected");
    });

    it("should toggle live view and set connection status accordingly", () => {
      const store = useAdminMetricsStore.getState();
      store.toggleLiveView();
      expect(useAdminMetricsStore.getState().liveViewEnabled).toBe(true);
      expect(useAdminMetricsStore.getState().connectionStatus).toBe("connecting");

      useAdminMetricsStore.getState().toggleLiveView();
      expect(useAdminMetricsStore.getState().liveViewEnabled).toBe(false);
      expect(useAdminMetricsStore.getState().connectionStatus).toBe("disconnected");
    });

    it("should allow setting connection status explicitly", () => {
      useAdminMetricsStore.getState().setConnectionStatus("connected");
      expect(useAdminMetricsStore.getState().connectionStatus).toBe("connected");
    });
  });

  describe("Appointment Store & Selectors", () => {
    beforeEach(() => {
      useAppointmentStore.setState({
        appointments: [],
        isLoading: false,
        error: null,
        selectedAppointmentId: null,
      });
      useAppointmentStore.getState().resetFilters();
    });

    it("should add and remove appointments correctly", () => {
      const apt: Appointment = {
        id: "apt-1",
        patientId: "p-1",
        patientName: "John Doe",
        scheduledAt: new Date(),
        duration: 30,
        status: "scheduled",
        chiefComplaint: "Severe headache",
      };

      useAppointmentStore.getState().addAppointment(apt);
      expect(useAppointmentStore.getState().appointments.length).toBe(1);

      useAppointmentStore.getState().removeAppointment("apt-1");
      expect(useAppointmentStore.getState().appointments.length).toBe(0);
    });

    it("should support optimistic updates and rollback", () => {
      const originalApt: Appointment = {
        id: "apt-1",
        patientId: "p-1",
        patientName: "John Doe",
        scheduledAt: new Date(),
        duration: 30,
        status: "scheduled",
      };

      useAppointmentStore.getState().addAppointment(originalApt);

      // Perform optimistic update
      useAppointmentStore.getState().optimisticUpdate("apt-1", { status: "confirmed" });
      expect(useAppointmentStore.getState().appointments[0].status).toBe("confirmed");

      // Rollback
      useAppointmentStore.getState().rollbackUpdate("apt-1", originalApt);
      expect(useAppointmentStore.getState().appointments[0].status).toBe("scheduled");
    });

    it("should filter appointments by search query and status selector", () => {
      const now = new Date();
      const apt1: Appointment = {
        id: "apt-1",
        patientId: "p-1",
        patientName: "Alice Smith",
        scheduledAt: now,
        duration: 30,
        status: "scheduled",
        chiefComplaint: "Fever and chills",
      };
      const apt2: Appointment = {
        id: "apt-2",
        patientId: "p-2",
        patientName: "Bob Jones",
        scheduledAt: now,
        duration: 30,
        status: "completed",
        chiefComplaint: "Back pain",
      };

      useAppointmentStore.getState().setAppointments([apt1, apt2]);

      // Filter by status
      useAppointmentStore.getState().setFilter("status", "scheduled");
      let filtered = selectFilteredAppointments(useAppointmentStore.getState());
      expect(filtered.length).toBe(1);
      expect(filtered[0].patientName).toBe("Alice Smith");

      // Filter by search query
      useAppointmentStore.getState().setFilter("status", "all");
      useAppointmentStore.getState().setFilter("searchQuery", "Jones");
      filtered = selectFilteredAppointments(useAppointmentStore.getState());
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("apt-2");
    });

    it("should select today and upcoming appointments correctly", () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const aptToday: Appointment = {
        id: "apt-today",
        patientId: "p-1",
        patientName: "Today Patient",
        scheduledAt: today,
        duration: 30,
        status: "scheduled",
      };

      const aptTomorrow: Appointment = {
        id: "apt-tomorrow",
        patientId: "p-2",
        patientName: "Tomorrow Patient",
        scheduledAt: tomorrow,
        duration: 30,
        status: "scheduled",
      };

      useAppointmentStore.getState().setAppointments([aptToday, aptTomorrow]);

      const todayList = selectTodayAppointments(useAppointmentStore.getState());
      expect(todayList.length).toBe(1);
      expect(todayList[0].id).toBe("apt-today");

      const upcomingList = selectUpcomingAppointments(useAppointmentStore.getState());
      expect(upcomingList.length).toBe(1);
      expect(upcomingList[0].id).toBe("apt-tomorrow");
    });
  });

  describe("Notification Store", () => {
    beforeEach(() => {
      useNotificationStore.setState({ isOpen: false, ephemeralNotifications: [] });
    });

    it("should toggle and close notification panel", () => {
      useNotificationStore.getState().togglePanel();
      expect(useNotificationStore.getState().isOpen).toBe(true);

      useNotificationStore.getState().closePanel();
      expect(useNotificationStore.getState().isOpen).toBe(false);
    });

    it("should add and limit ephemeral real-time notifications", () => {
      useNotificationStore.getState().addEphemeral({
        type: "appointment_reminder",
        title: "Upcoming Appointment",
        message: "Your appointment starts in 15 minutes",
      });

      const state = useNotificationStore.getState();
      expect(selectEphemeralCount(state)).toBe(1);
      expect(state.ephemeralNotifications[0].title).toBe("Upcoming Appointment");

      useNotificationStore.getState().clearEphemeral();
      expect(selectEphemeralCount(useNotificationStore.getState())).toBe(0);
    });
  });
});
