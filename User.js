(function (global) {
    class User {
        constructor(name, email, password) {
            this.name = typeof name === 'string' ? name.trim() : '';
            this.email = typeof email === 'string' ? email.trim().toLowerCase() : '';
            this.password = User.hashPasswordSync(password ?? '');
            this.listedShelters = [];
            this.needsShelter = false;
            this.shelterRequest = {
                contactInfo: {
                    name: '',
                    email: '',
                    phone: ''
                },
                peopleCount: 0,
                hasPets: false,
                openToAnimals: false,
                allergies: '',
                preferences: '',
                canSleepOnCouch: false,
                notes: ''
            };
        }

        static sanitizeText(value) {
            return typeof value === 'string' ? value.trim() : '';
        }

        static normalizePetList(pets) {
            if (!Array.isArray(pets)) {
                return [];
            }

            return pets
                .map((pet) => User.sanitizeText(String(pet)))
                .filter(Boolean);
        }

        static async hashPassword(password) {
            const value = String(password ?? '');

            if (typeof crypto !== 'undefined' && crypto.subtle) {
                const encoder = new TextEncoder();
                const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
                return Array.from(new Uint8Array(hashBuffer))
                    .map((byte) => byte.toString(16).padStart(2, '0'))
                    .join('');
            }

            return User.hashPasswordSync(value);
        }

        static hashPasswordSync(password) {
            const value = String(password ?? '');
            let hash = 0;

            for (let i = 0; i < value.length; i += 1) {
                hash = (hash << 5) - hash + value.charCodeAt(i);
                hash |= 0;
            }

            return String(Math.abs(hash));
        }

        async checkPassword(password) {
            return User.hashPasswordSync(password) === this.password;
        }

        setShelterListing(details = {}) {
            const shelter = new Shelter(
                details?.address ?? '',
                details?.capacity ?? 0,
                details?.pets ?? [],
                details?.openToReceivePets ?? false,
                details?.otherDetails ?? '',
                details?.id ?? null,
                details?.requests ?? []
            );

            this.listedShelters.push(shelter);
            return shelter;
        }

        updateShelterListing(id, details = {}) {
            const normalizedId = String(id ?? '');
            const shelterIndex = this.listedShelters.findIndex((entry) => String(entry?.id ?? entry?.address ?? '') === normalizedId);

            const shelter = new Shelter(
                details?.address ?? '',
                details?.capacity ?? 0,
                details?.pets ?? [],
                details?.openToReceivePets ?? false,
                details?.otherDetails ?? '',
                normalizedId || null,
                details?.requests ?? []
            );

            if (shelterIndex === -1) {
                this.listedShelters.push(shelter);
                return shelter;
            }

            this.listedShelters[shelterIndex] = shelter;
            return shelter;
        }

        removeShelterListing(id) {
            const normalizedId = String(id ?? '');
            const shelterIndex = this.listedShelters.findIndex((entry) => String(entry?.id ?? entry?.address ?? '') === normalizedId);

            if (shelterIndex === -1) {
                return -1;
            }

            this.listedShelters.splice(shelterIndex, 1);
            return shelterIndex;
        }

        setShelterRequest(details = {}) {
            this.needsShelter = true;
            this.shelterRequest = {
                contactInfo: {
                    name: User.sanitizeText(details?.contactInfo?.name ?? details?.name ?? ''),
                    email: User.sanitizeText(details?.contactInfo?.email ?? details?.email ?? '').toLowerCase(),
                    phone: User.sanitizeText(details?.contactInfo?.phone ?? details?.phone ?? '')
                },
                peopleCount: Number(details?.peopleCount ?? 0) || 0,
                hasPets: Boolean(details?.hasPets),
                openToAnimals: Boolean(details?.openToAnimals ?? details?.mindAnimalInShelter),
                allergies: User.sanitizeText(details?.allergies ?? ''),
                preferences: User.sanitizeText(details?.preferences ?? ''),
                canSleepOnCouch: Boolean(details?.canSleepOnCouch),
                notes: User.sanitizeText(details?.notes ?? '')
            };

            return this.shelterRequest;
        }

        static fromObject(data) {
            const user = new User(data?.name ?? '', data?.email ?? '', data?.password ?? '');
            user.name = data?.name ?? user.name;
            user.email = (data?.email ?? user.email).toLowerCase();
            user.password = data?.password ?? user.password;
            user.listedShelters = Array.isArray(data?.listedShelters)
                ? data.listedShelters.map((shelter, index) => new Shelter(
                    shelter?.address ?? '',
                    shelter?.capacity ?? 0,
                    shelter?.pets ?? [],
                    shelter?.openToReceivePets ?? false,
                    shelter?.otherDetails ?? '',
                    shelter?.id ?? `shelter-${index}-${(shelter?.address ?? '').replace(/\s+/g, '-').toLowerCase()}`,
                    shelter?.requests ?? []
                ))
                : [];
            user.needsShelter = Boolean(data?.needsShelter || data?.shelterRequest);
            user.shelterRequest = {
                contactInfo: {
                    name: User.sanitizeText(data?.shelterRequest?.contactInfo?.name ?? data?.name ?? ''),
                    email: User.sanitizeText(data?.shelterRequest?.contactInfo?.email ?? data?.email ?? '').toLowerCase(),
                    phone: User.sanitizeText(data?.shelterRequest?.contactInfo?.phone ?? '')
                },
                peopleCount: Number(data?.shelterRequest?.peopleCount ?? 0) || 0,
                hasPets: Boolean(data?.shelterRequest?.hasPets),
                openToAnimals: Boolean(data?.shelterRequest?.openToAnimals ?? data?.shelterRequest?.mindAnimalInShelter),
                allergies: User.sanitizeText(data?.shelterRequest?.allergies ?? ''),
                preferences: User.sanitizeText(data?.shelterRequest?.preferences ?? ''),
                canSleepOnCouch: Boolean(data?.shelterRequest?.canSleepOnCouch),
                notes: User.sanitizeText(data?.shelterRequest?.notes ?? '')
            };
            return user;
        }

        listShelter(shelter) {
            this.listedShelters.push(shelter);
        }
    }

    class Shelter {
        constructor(address, capacity, pets, openToReceivePets, otherDetails, id = null, requests = []) {
            this.id = id || `shelter-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
            this.address = User.sanitizeText(address);
            this.capacity = Number.isFinite(Number(capacity)) ? Number(capacity) : 0;
            this.pets = User.normalizePetList(pets);
            this.openToReceivePets = Boolean(openToReceivePets);
            this.otherDetails = User.sanitizeText(otherDetails);
            this.requests = Array.isArray(requests)
                ? requests.map((request) => ({ ...request }))
                : [];
        }
    }

    global.User = User;
    global.Shelter = Shelter;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { User, Shelter };
    }
})(typeof window !== 'undefined' ? window : globalThis);