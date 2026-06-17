from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from typing import ClassVar as _ClassVar, Optional as _Optional

DESCRIPTOR: _descriptor.FileDescriptor

class GenerateFlashcardsRequest(_message.Message):
    __slots__ = ("upload_id",)
    UPLOAD_ID_FIELD_NUMBER: _ClassVar[int]
    upload_id: str
    def __init__(self, upload_id: _Optional[str] = ...) -> None: ...

class Flashcard(_message.Message):
    __slots__ = ("id", "question", "answer", "source_ref", "last_updated")
    ID_FIELD_NUMBER: _ClassVar[int]
    QUESTION_FIELD_NUMBER: _ClassVar[int]
    ANSWER_FIELD_NUMBER: _ClassVar[int]
    SOURCE_REF_FIELD_NUMBER: _ClassVar[int]
    LAST_UPDATED_FIELD_NUMBER: _ClassVar[int]
    id: str
    question: str
    answer: str
    source_ref: str
    last_updated: str
    def __init__(self, id: _Optional[str] = ..., question: _Optional[str] = ..., answer: _Optional[str] = ..., source_ref: _Optional[str] = ..., last_updated: _Optional[str] = ...) -> None: ...

class Explanation(_message.Message):
    __slots__ = ("explanation",)
    EXPLANATION_FIELD_NUMBER: _ClassVar[int]
    explanation: str
    def __init__(self, explanation: _Optional[str] = ...) -> None: ...
