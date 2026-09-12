import * as calendarService from "../services/calendar.service.js";

export const getEvents = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const events = await calendarService.getUserCalendarEvents(req.user._id, projectId);

    res.status(200).json({
      success: true,
      data: {
        events,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const event = await calendarService.createEvent(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: "Calendar event created",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await calendarService.updateEvent(req.user._id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: "Calendar event updated",
      data: { event },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    await calendarService.deleteEvent(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      message: "Calendar event deleted",
    });
  } catch (error) {
    next(error);
  }
};
