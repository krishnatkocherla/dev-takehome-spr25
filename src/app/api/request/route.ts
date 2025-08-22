import dbConnect from "@/lib/database/database";
import Request from "@/lib/database/requests";
import { HTTP_STATUS_CODE, ResponseType, RESPONSES } from "@/lib/types/apiResponse";
import { PAGINATION_PAGE_SIZE } from "@/lib/constants/config";

// not using serverResponseBuilder.ts for debugging purposes in postman; also changed response message for more clarity in certain cases
export async function GET(request: Request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * PAGINATION_PAGE_SIZE;
    const status = searchParams.get("status") || undefined;

    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }

    const totalRequests = await Request.countDocuments(filter);
    const requests = await Request.find(filter)
      .sort({ createdDate: -1 })
      .skip(skip)
      .limit(PAGINATION_PAGE_SIZE);

    return new Response(
      JSON.stringify({
        success: true,
        message: RESPONSES[ResponseType.SUCCESS].message,
        page,
        totalPages: Math.ceil(totalRequests / PAGINATION_PAGE_SIZE),
        totalRequests,
        data: requests,
      }),
      { status: RESPONSES[ResponseType.SUCCESS].code, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: error.message || RESPONSES[ResponseType.UNKNOWN_ERROR].message }),
      { status: RESPONSES[ResponseType.UNKNOWN_ERROR].code, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { requestorName, itemRequested } = body;
    if (!requestorName || !itemRequested) {
      return new Response(
        JSON.stringify({ success: false, message: RESPONSES[ResponseType.INVALID_INPUT].message }),
        { status: RESPONSES[ResponseType.INVALID_INPUT].code, headers: { "Content-Type": "application/json" } }
      );
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
    return new Response(
      JSON.stringify({ success: true, message: RESPONSES[ResponseType.CREATED].message, data: newRequest }),
      { status: RESPONSES[ResponseType.CREATED].code, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: error.message || RESPONSES[ResponseType.UNKNOWN_ERROR].message }),
      { status: RESPONSES[ResponseType.UNKNOWN_ERROR].code, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PATCH(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    // single edit
    if (body.id && body.status) {
      const allowedStatuses = ["pending", "completed", "approved", "rejected"];
      if (!allowedStatuses.includes(body.status)) {
        return new Response(
          JSON.stringify({ success: false, message: "Invalid status value." }),
          { status: RESPONSES[ResponseType.INVALID_INPUT].code, headers: { "Content-Type": "application/json" } }
        );
      }
      const updatedRequest = await Request.findOneAndUpdate(
        { requestId: body.id },
        { status: body.status, lastEditedDate: new Date() },
        { new: true }
      );
      if (!updatedRequest) {
        return new Response(
          JSON.stringify({ success: false, message: RESPONSES[ResponseType.INVALID_INPUT].message }),
          { status: RESPONSES[ResponseType.INVALID_INPUT].code, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, message: RESPONSES[ResponseType.SUCCESS].message, data: updatedRequest }),
        { status: RESPONSES[ResponseType.SUCCESS].code, headers: { "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ success: true, message: RESPONSES[ResponseType.SUCCESS].message, data: results }),
        { status: RESPONSES[ResponseType.SUCCESS].code, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ success: false, message: RESPONSES[ResponseType.INVALID_INPUT].message }),
      { status: RESPONSES[ResponseType.INVALID_INPUT].code, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: error.message || RESPONSES[ResponseType.UNKNOWN_ERROR].message }),
      { status: RESPONSES[ResponseType.UNKNOWN_ERROR].code, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: RESPONSES[ResponseType.INVALID_INPUT].message }),
        { status: RESPONSES[ResponseType.INVALID_INPUT].code, headers: { "Content-Type": "application/json" } }
      );
    }
    const result = await Request.deleteMany({ requestId: { $in: ids } });
    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${result.deletedCount} requests.` || RESPONSES[ResponseType.SUCCESS].message,
      }),
      { status: RESPONSES[ResponseType.SUCCESS].code, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: error.message || RESPONSES[ResponseType.UNKNOWN_ERROR].message }),
      { status: RESPONSES[ResponseType.UNKNOWN_ERROR].code, headers: { "Content-Type": "application/json" } }
    );
  }
}