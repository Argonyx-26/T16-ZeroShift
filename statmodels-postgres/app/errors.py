class AppError(Exception):
    code = "INTERNAL_ERROR"
    retriable = False
    status_code = 500

    def __init__(self, message: str):
        self.message = message
        super().__init__(message)

    def to_dict(self):
        return {"code": self.code, "message": self.message, "retriable": self.retriable}


class TopicNotFound(AppError):
    code = "TOPIC_NOT_FOUND"
    status_code = 404


class InsufficientData(AppError):
    code = "INSUFFICIENT_DATA"
    status_code = 200  # not a failure — a valid "not enough attempts yet" state


class LLMTimeout(AppError):
    code = "LLM_TIMEOUT"
    retriable = True
    status_code = 503


class StudentNotFound(AppError):
    code = "STUDENT_NOT_FOUND"
    status_code = 404
