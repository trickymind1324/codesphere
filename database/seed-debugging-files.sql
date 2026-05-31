-- Seed debugging problem files for all 9 remaining debugging problems

-- 1. fix-null-pointer (60709a73-e108-4c26-a174-ecaedb33bd99)
INSERT INTO problem_files (id, "problemId", language, "filePath", content, "isEntryPoint", "isReadOnly", "order")
VALUES
  (uuid_generate_v4(), '60709a73-e108-4c26-a174-ecaedb33bd99', 'python', 'main.py',
   'from user_service import UserService

def main():
    service = UserService()

    # BUG: user might be None, causing NullPointerException equivalent
    user = service.find_user_by_id(999)
    print(f"User name: {user.name}")  # This will fail if user is None
    print(f"User email: {user.email}")

if __name__ == "__main__":
    main()
', true, false, 0),
  (uuid_generate_v4(), '60709a73-e108-4c26-a174-ecaedb33bd99', 'python', 'user_service.py',
   'from models import User

class UserService:
    def __init__(self):
        self.users = {
            1: User(1, "Alice", "alice@example.com"),
            2: User(2, "Bob", "bob@example.com"),
        }

    def find_user_by_id(self, user_id: int):
        """Returns User or None if not found"""
        return self.users.get(user_id)
', false, true, 1),
  (uuid_generate_v4(), '60709a73-e108-4c26-a174-ecaedb33bd99', 'python', 'models.py',
   'class User:
    def __init__(self, id: int, name: str, email: str):
        self.id = id
        self.name = name
        self.email = email

    def __repr__(self):
        return f"User(id={self.id}, name={self.name})"
', false, true, 2);

-- 2. fix-off-by-one-error (491184fb-317d-4fc0-a42b-0a89e45a3aaa)
INSERT INTO problem_files (id, "problemId", language, "filePath", content, "isEntryPoint", "isReadOnly", "order")
VALUES
  (uuid_generate_v4(), '491184fb-317d-4fc0-a42b-0a89e45a3aaa', 'python', 'main.py',
   'from array_utils import process_array

def main():
    data = [10, 20, 30, 40, 50]

    # BUG: Off-by-one error in the processing function
    result = process_array(data)
    print(f"Original: {data}")
    print(f"Processed: {result}")
    print(f"Expected sum: {sum(data)}")
    print(f"Actual sum: {sum(result)}")

if __name__ == "__main__":
    main()
', true, false, 0),
  (uuid_generate_v4(), '491184fb-317d-4fc0-a42b-0a89e45a3aaa', 'python', 'array_utils.py',
   'def process_array(arr):
    """Double each element in the array"""
    result = []
    # BUG: Should be range(len(arr)), not range(len(arr) - 1)
    for i in range(len(arr) - 1):
        result.append(arr[i] * 2)
    return result
', false, false, 1);

-- 3. fix-docker-networking (422e942c-c11e-4196-94d7-e657e210f491)
INSERT INTO problem_files (id, "problemId", language, "filePath", content, "isEntryPoint", "isReadOnly", "order")
VALUES
  (uuid_generate_v4(), '422e942c-c11e-4196-94d7-e657e210f491', 'python', 'main.py',
   'from config import Config
from api_client import APIClient

def main():
    config = Config()
    client = APIClient(config)

    # BUG: The hostname resolution fails in Docker
    response = client.fetch_data()
    print(f"Response: {response}")

if __name__ == "__main__":
    main()
', true, false, 0),
  (uuid_generate_v4(), '422e942c-c11e-4196-94d7-e657e210f491', 'python', 'config.py',
   'class Config:
    # BUG: localhost won''t work in Docker containers
    # Should use service name or host.docker.internal
    API_HOST = "localhost"
    API_PORT = 8080

    @property
    def api_url(self):
        return f"http://{self.API_HOST}:{self.API_PORT}"
', false, false, 1),
  (uuid_generate_v4(), '422e942c-c11e-4196-94d7-e657e210f491', 'python', 'api_client.py',
   'class APIClient:
    def __init__(self, config):
        self.config = config

    def fetch_data(self):
        # Simulating API call
        print(f"Connecting to: {self.config.api_url}")
        return {"status": "connected", "url": self.config.api_url}
', false, true, 2);

-- 4. debug-jwt-logout-bug (20bfdab3-f215-49b2-a796-d27b84eb9e69)
INSERT INTO problem_files (id, "problemId", language, "filePath", content, "isEntryPoint", "isReadOnly", "order")
VALUES
  (uuid_generate_v4(), '20bfdab3-f215-49b2-a796-d27b84eb9e69', 'python', 'main.py',
   'from auth_service import AuthService

def main():
    auth = AuthService()

    # Login and get token
    token = auth.login("user@example.com", "password123")
    print(f"Logged in with token: {token[:20]}...")

    # Verify token works
    print(f"Token valid: {auth.verify_token(token)}")

    # Logout
    auth.logout(token)
    print("Logged out")

    # BUG: Token should be invalid after logout, but it still works!
    print(f"Token still valid after logout: {auth.verify_token(token)}")

if __name__ == "__main__":
    main()
', true, false, 0),
  (uuid_generate_v4(), '20bfdab3-f215-49b2-a796-d27b84eb9e69', 'python', 'auth_service.py',
   'import hashlib
import time

class AuthService:
    def __init__(self):
        self.blacklisted_tokens = []  # BUG: Should be a set for O(1) lookup

    def login(self, email: str, password: str) -> str:
        # Generate a simple token (in real app, use JWT)
        token = hashlib.sha256(f"{email}{time.time()}".encode()).hexdigest()
        return token

    def logout(self, token: str):
        # BUG: Token is not being added to blacklist correctly
        self.blacklisted_tokens = [token]  # Should be append, not reassign

    def verify_token(self, token: str) -> bool:
        # BUG: Not checking blacklist properly
        return token not in self.blacklisted_tokens
', false, false, 1);

-- 5. fix-race-condition-counter (b0c8b579-bb58-4ce5-85bc-b82667f0c8fa)
INSERT INTO problem_files (id, "problemId", language, "filePath", content, "isEntryPoint", "isReadOnly", "order")
VALUES
  (uuid_generate_v4(), 'b0c8b579-bb58-4ce5-85bc-b82667f0c8fa', 'python', 'main.py',
   'import threading
from counter import Counter

def main():
    counter = Counter()
    threads = []

    # Create 10 threads, each incrementing 1000 times
    for _ in range(10):
        t = threading.Thread(target=lambda: [counter.increment() for _ in range(1000)])
        threads.append(t)

    # Start all threads
    for t in threads:
        t.start()

    # Wait for all threads to complete
    for t in threads:
        t.join()

    # BUG: Expected 10000, but due to race condition, result is less
    print(f"Final count: {counter.get_value()}")
    print(f"Expected: 10000")

if __name__ == "__main__":
    main()
', true, false, 0),
  (uuid_generate_v4(), 'b0c8b579-bb58-4ce5-85bc-b82667f0c8fa', 'python', 'counter.py',
   'class Counter:
    def __init__(self):
        self.value = 0
        # BUG: Missing lock for thread safety
        # self.lock = threading.Lock()

    def increment(self):
        # BUG: This is not thread-safe!
        # Should use: with self.lock:
        current = self.value
        self.value = current + 1

    def get_value(self):
        return self.value
', false, false, 1);

-- 6. debug-sql-n1-query (436447e2-aaa0-4f3c-8c95-a663c19bc229)
INSERT INTO problem_files (id, "problemId", language, "filePath", content, "isEntryPoint", "isReadOnly", "order")
VALUES
  (uuid_generate_v4(), '436447e2-aaa0-4f3c-8c95-a663c19bc229', 'python', 'main.py',
   'from database import Database
from repository import UserRepository

def main():
    db = Database()
    repo = UserRepository(db)

    # BUG: N+1 query problem - this makes too many database calls
    users_with_orders = repo.get_users_with_orders()

    for user in users_with_orders:
        print(f"{user[''name'']} has {len(user[''orders''])} orders")

    print(f"\\nTotal DB queries made: {db.query_count}")
    print("Expected: 1-2 queries (with JOIN)")

if __name__ == "__main__":
    main()
', true, false, 0),
  (uuid_generate_v4(), '436447e2-aaa0-4f3c-8c95-a663c19bc229', 'python', 'repository.py',
   'class UserRepository:
    def __init__(self, db):
        self.db = db

    def get_users_with_orders(self):
        # BUG: N+1 query problem!
        # First query: get all users
        users = self.db.query("SELECT * FROM users")

        result = []
        for user in users:
            # N additional queries: one for each user''s orders
            orders = self.db.query(f"SELECT * FROM orders WHERE user_id = {user[''id'']}")
            result.append({**user, "orders": orders})

        return result

    # FIX: Should use a single JOIN query:
    # def get_users_with_orders_optimized(self):
    #     return self.db.query("""
    #         SELECT u.*, o.* FROM users u
    #         LEFT JOIN orders o ON u.id = o.user_id
    #     """)
', false, false, 1),
  (uuid_generate_v4(), '436447e2-aaa0-4f3c-8c95-a663c19bc229', 'python', 'database.py',
   'class Database:
    """Mock database for demonstration"""
    def __init__(self):
        self.query_count = 0
        self.users = [
            {"id": 1, "name": "Alice"},
            {"id": 2, "name": "Bob"},
            {"id": 3, "name": "Charlie"},
        ]
        self.orders = [
            {"id": 1, "user_id": 1, "total": 100},
            {"id": 2, "user_id": 1, "total": 200},
            {"id": 3, "user_id": 2, "total": 150},
        ]

    def query(self, sql):
        self.query_count += 1
        print(f"[Query #{self.query_count}]: {sql[:50]}...")

        if "FROM users" in sql and "JOIN" not in sql:
            return self.users
        elif "FROM orders" in sql:
            user_id = int(sql.split("=")[1].strip())
            return [o for o in self.orders if o["user_id"] == user_id]
        return []
', false, true, 2);

-- 7. fix-infinite-recursion (b320e560-d441-4977-aba2-35b5519a41da)
INSERT INTO problem_files (id, "problemId", language, "filePath", content, "isEntryPoint", "isReadOnly", "order")
VALUES
  (uuid_generate_v4(), 'b320e560-d441-4977-aba2-35b5519a41da', 'python', 'main.py',
   'from tree_utils import TreeNode, find_max_depth

def main():
    # Create a binary tree
    #       1
    #      / \
    #     2   3
    #    / \
    #   4   5
    root = TreeNode(1)
    root.left = TreeNode(2)
    root.right = TreeNode(3)
    root.left.left = TreeNode(4)
    root.left.right = TreeNode(5)

    # BUG: This will cause infinite recursion!
    depth = find_max_depth(root)
    print(f"Max depth: {depth}")

if __name__ == "__main__":
    main()
', true, false, 0),
  (uuid_generate_v4(), 'b320e560-d441-4977-aba2-35b5519a41da', 'python', 'tree_utils.py',
   'class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def find_max_depth(node):
    """Find the maximum depth of a binary tree"""
    if node is None:
        return 0

    # BUG: Calling find_max_depth(node) instead of find_max_depth(node.left/right)
    # This causes infinite recursion!
    left_depth = find_max_depth(node)   # Should be node.left
    right_depth = find_max_depth(node)  # Should be node.right

    return max(left_depth, right_depth) + 1
', false, false, 1);

-- 8. fix-slow-api-endpoint (d8f2feea-1723-4708-be50-a76d50b96c57)
INSERT INTO problem_files (id, "problemId", language, "filePath", content, "isEntryPoint", "isReadOnly", "order")
VALUES
  (uuid_generate_v4(), 'd8f2feea-1723-4708-be50-a76d50b96c57', 'python', 'main.py',
   'import time
from api_handler import handle_search_request

def main():
    # Simulate search requests
    queries = ["python", "javascript", "rust"]

    for query in queries:
        start = time.time()
        result = handle_search_request(query)
        elapsed = time.time() - start
        print(f"Search ''{query}'': {len(result)} results in {elapsed:.2f}s")

if __name__ == "__main__":
    main()
', true, false, 0),
  (uuid_generate_v4(), 'd8f2feea-1723-4708-be50-a76d50b96c57', 'python', 'api_handler.py',
   'from search_service import SearchService

# BUG: Creating a new SearchService instance for every request!
# This causes the cache to be reset each time

def handle_search_request(query: str):
    # BUG: Should reuse a single service instance
    service = SearchService()
    return service.search(query)

# FIX: Use a singleton or module-level instance
# _search_service = SearchService()
# def handle_search_request(query: str):
#     return _search_service.search(query)
', false, false, 1),
  (uuid_generate_v4(), 'd8f2feea-1723-4708-be50-a76d50b96c57', 'python', 'search_service.py',
   'import time

class SearchService:
    def __init__(self):
        self.cache = {}
        self._load_index()  # Expensive operation!

    def _load_index(self):
        """Simulate loading search index - expensive operation"""
        print("Loading search index... (expensive!)")
        time.sleep(0.5)  # Simulate slow loading

    def search(self, query: str):
        if query in self.cache:
            return self.cache[query]

        # Simulate search
        results = [f"Result for {query} #{i}" for i in range(5)]
        self.cache[query] = results
        return results
', false, true, 2);

-- 9. fix-react-memory-leak (46ca9ea3-f796-4925-b299-fe4ac87cc90a)
-- Using Python to simulate React-like component lifecycle
INSERT INTO problem_files (id, "problemId", language, "filePath", content, "isEntryPoint", "isReadOnly", "order")
VALUES
  (uuid_generate_v4(), '46ca9ea3-f796-4925-b299-fe4ac87cc90a', 'python', 'main.py',
   'from component import DataFetcherComponent
import time

def main():
    print("=== Simulating React Component Lifecycle ===\\n")

    # Mount component
    component = DataFetcherComponent()
    component.mount()

    # Simulate some time passing
    time.sleep(0.5)

    # Unmount component
    component.unmount()

    # BUG: The interval is still running after unmount!
    print("\\nComponent unmounted. Waiting to see if interval stops...")
    time.sleep(1)

    print("\\nCheck: Is the interval still running?")
    print(f"Active timers: {component.get_active_timers()}")

if __name__ == "__main__":
    main()
', true, false, 0),
  (uuid_generate_v4(), '46ca9ea3-f796-4925-b299-fe4ac87cc90a', 'python', 'component.py',
   'import threading
import time

class DataFetcherComponent:
    """Simulates a React component with useEffect"""

    def __init__(self):
        self.mounted = False
        self.interval_id = None
        self.data = None
        self.active_timers = []

    def mount(self):
        """Simulates componentDidMount / useEffect"""
        print("Component mounting...")
        self.mounted = True

        # BUG: Starting interval but never cleaning it up!
        # In React: useEffect without cleanup function
        def fetch_data():
            while self.mounted or True:  # BUG: "or True" keeps it running!
                print("  Fetching data...")
                self.data = {"timestamp": time.time()}
                time.sleep(0.3)

        self.interval_id = threading.Thread(target=fetch_data, daemon=True)
        self.interval_id.start()
        self.active_timers.append(self.interval_id)

        # FIX: Should be:
        # def fetch_data():
        #     while self.mounted:  # Only run while mounted
        #         print("  Fetching data...")
        #         self.data = {"timestamp": time.time()}
        #         time.sleep(0.3)

    def unmount(self):
        """Simulates componentWillUnmount / useEffect cleanup"""
        print("Component unmounting...")
        self.mounted = False
        # BUG: Not properly stopping the interval!
        # Should wait for thread to finish or use a proper cancellation mechanism

    def get_active_timers(self):
        return len([t for t in self.active_timers if t.is_alive()])
', false, false, 1);

-- Verify all files were inserted
SELECT p.slug, COUNT(pf.id) as file_count
FROM problems p
LEFT JOIN problem_files pf ON p.id = pf."problemId"
WHERE p."problemType" = 'debugging'
GROUP BY p.slug
ORDER BY p.slug;
