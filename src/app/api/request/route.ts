import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/database/database";
import Request from "@/lib/database/requests";
import { HTTP_STATUS_CODE, ResponseType, RESPONSES } from "@/lib/types/apiResponse";
import { PAGINATION_PAGE_SIZE } from "@/lib/constants/config";

// not using serverResponseBuilder.ts for debugging purposes in postman; also changed response message for more clarity in certain cases
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      const { requestorName, itemRequested } = req.body;

      if (!requestorName || !itemRequested) {
        return res
          .status(RESPONSES[ResponseType.INVALID_INPUT].code)
          .json({ success: false, message: RESPONSES[ResponseType.INVALID_INPUT].message });

      }

      const now = new Date();
      
      const requestCount = await Request.countDocuments();
      const newRequestId = requestCount + 1;

      const newRequest = await Request.create({
        requestId: newRequestId,
        requestorName,
        itemRequested,
        createdDate: now,
        lastEditedDate: now,
        status: 'pending',
      });

      res
        .status(RESPONSES[ResponseType.CREATED].code)
        .json({ success: true, message: RESPONSES[ResponseType.CREATED].message, data: newRequest });

    } catch (error: any) {
        res
        .status(RESPONSES[ResponseType.UNKNOWN_ERROR].code)
        .json({ success: false, message: error.message || RESPONSES[ResponseType.UNKNOWN_ERROR].message });
    }
  }

  else if (req.method === "GET") {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const skip = (page - 1) * PAGINATION_PAGE_SIZE;
      const status = req.query.status as string | undefined

      const filter: Record<string, any> = {};
      if (status) {
        filter.status = status;
      }

      const totalRequests = await Request.countDocuments(filter);
      const requests = await Request.find({})
        .sort({ createdDate: -1 })
        .skip(skip)
        .limit(PAGINATION_PAGE_SIZE);

      res.status(RESPONSES[ResponseType.SUCCESS].code).json({
        success: true,
        message: RESPONSES[ResponseType.SUCCESS].message,
        page,
        totalPages: Math.ceil(totalRequests / PAGINATION_PAGE_SIZE),
        totalRequests,
        data: requests,
      });
    } catch (error: any) {
      res
        .status(RESPONSES[ResponseType.UNKNOWN_ERROR].code)
        .json({ success: false, message: error.message || RESPONSES[ResponseType.UNKNOWN_ERROR].message });
    }
  }

  // handles above/beyond batch patch for status updates
  else if (req.method === "PATCH") {
    try {
      const body = req.body;

      // single edit
      if (body.id && body.status) {
        const allowedStatuses = ["pending", "completed", "approved", "rejected"];
        if (!allowedStatuses.includes(body.status)) {
          return res
            .status(RESPONSES[ResponseType.INVALID_INPUT].code)
            .json({ success: false, message: "Invalid status value." });
        }

        const updatedRequest = await Request.findOneAndUpdate(
          { requestId: body.id },
          { status: body.status, lastEditedDate: new Date() },
          { new: true }
        );

        if (!updatedRequest) {
          return res
            .status(RESPONSES[ResponseType.INVALID_INPUT].code)
            .json({ success: false, message: RESPONSES[ResponseType.INVALID_INPUT].message});
        }

        return res.status(RESPONSES[ResponseType.SUCCESS].code).json({
          success: true,
          message: RESPONSES[ResponseType.SUCCESS].message,
          data: updatedRequest,
        });
      }

      // batch edit
      if (Array.isArray(body.updates)) {
        const results = [];
        for (const update of body.updates) {
          const { id, status } = update;
          if (!id || !status) continue;

          const updatedRequest = await Request.findOneAndUpdate(
            { requestId: id },
            { status, lastEditedDate: new Date() },
            { new: true }
          );
          if (updatedRequest) results.push(updatedRequest);
        }

        return res.status(RESPONSES[ResponseType.SUCCESS].code).json({
          success: true,
          message: RESPONSES[ResponseType.SUCCESS].message,
          data: results,
        });
      }

      return res
        .status(RESPONSES[ResponseType.INVALID_INPUT].code)
        .json({ success: false, message: RESPONSES[ResponseType.INVALID_INPUT].message});
    } catch (error: any) {
      res
        .status(RESPONSES[ResponseType.UNKNOWN_ERROR].code)
        .json({ success: false, message: error.message || RESPONSES[ResponseType.UNKNOWN_ERROR].message });
    }
  }

  // above and beyond batch delete
  else if (req.method === "DELETE") {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res
          .status(RESPONSES[ResponseType.INVALID_INPUT].code)
          .json({ success: false, message: RESPONSES[ResponseType.INVALID_INPUT].message });
      }

      const result = await Request.deleteMany({ requestId: { $in: ids } });

      res.status(RESPONSES[ResponseType.SUCCESS].code).json({
        success: true,
        message: `Deleted ${result.deletedCount} requests.` || RESPONSES[ResponseType.SUCCESS].message,
      });
    } catch (error: any) {
      res
        .status(RESPONSES[ResponseType.UNKNOWN_ERROR].code)
        .json({ success: false, message: error.message || RESPONSES[ResponseType.UNKNOWN_ERROR].message });
    }
  }

  // handle unsupported methods
  else {
    res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }
}