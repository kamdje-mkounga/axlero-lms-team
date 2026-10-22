const listCourses = async (req, res) => {
    try {
        res.status(200).json([]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getCourse = async (req, res) => {
    try {
        res.status(200).json({ message: "Détails du cours" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createCourse = async (req, res) => {
    try {
        res.status(201).json({ message: "Cours créé avec succès" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateCourse = async (req, res) => {
    try {
        res.status(200).json({ message: "Cours mis à jour" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteCourse = async (req, res) => {
    try {
        res.status(200).json({ message: "Cours supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    listCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
};